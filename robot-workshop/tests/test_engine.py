import json
import unittest
from copy import deepcopy
from engine.content import load_content
from engine.economy import action_cost, parts_cost, profit
from engine.game import Game
from engine.student_runner import check_code
from engine.validator import ConfigurationError, validate_config
from engine.workers import Factory, initial_config


def strategy(content, name="lean"):
    config = initial_config(content)
    presets = {"reception":"capacity", "warehouse":"stock", "engineer":"careful",
               "assembler":"test", "qc":"careful", "cleaner":"tidy"}
    for role, w in config.items():
        w["model"] = "standard"
        w["context"] = 2
        w["tools"] = [id for id, t in content["tools"].items() if role in t["allowed_roles"]]
        p = content["instructions"][presets[role]]
        w["instructions"], w["rules"] = p["text"], p["rules"][:]
    for role in ("reception", "cleaner"):
        config[role]["model"], config[role]["context"] = "cheap", 0
    if name == "quality":
        for role in ("engineer", "qc"):
            config[role]["model"] = "smart"
        config["assembler"]["rules"] = ["prioritize_quality", "test_before_send", "report_errors"]
        config["assembler"]["context"] = 5
    if name == "throughput":
        config["assembler"]["rules"] = ["prioritize_speed", "test_before_send", "report_errors"]
        config["assembler"]["model"] = "smart"
    return config


class EngineTests(unittest.TestCase):
    def setUp(self):
        self.c = load_content()

    def game(self, name="lean", seed=42):
        g = Game(seed, self.c)
        g.configure(strategy(self.c, name))
        return g

    def test_recipe_and_prices(self):
        p = self.c["products"]["robot_vacuum_basic"]
        self.assertEqual(p["parts"]["sensor"], 2)
        self.assertEqual(parts_cost(p["parts"], p), 165)
        self.assertEqual(profit(dict(revenue=500, material_cost=165, ai_cost=30, operating_cost=10, penalties=5)), 290)

    def test_model_context_and_tool_pricing(self):
        w = initial_config(self.c)["warehouse"]
        smart = action_cost(w, "order_parts", self.c)
        w["model"] = "cheap"
        self.assertLess(action_cost(w, "order_parts", self.c), smart)
        large = action_cost(w, "order_parts", self.c)
        w["context"] = 0
        self.assertLess(action_cost(w, "order_parts", self.c), large)
        small = action_cost(w, "order_parts", self.c)
        w["tools"].append("check_stock")
        self.assertGreater(action_cost(w, "order_parts", self.c), small)

    def test_validation_typos_and_roles(self):
        config = initial_config(self.c)
        config["warehouse"]["tools"].append("check_stok")
        with self.assertRaisesRegex(ConfigurationError, "check_stock"):
            validate_config(config, self.c)
        config["warehouse"]["tools"] = ["inspect_product"]
        with self.assertRaises(ConfigurationError):
            validate_config(config, self.c)

    def test_worker_api_is_atomic(self):
        config = initial_config(self.c)
        factory = Factory(config, self.c)
        w = factory.worker("warehouse")
        w.set_model("standard")
        w.set_context(5)
        w.add_tool("check_stock")
        w.enable_rule("check_before_order")
        with self.assertRaises(ConfigurationError):
            w.set_context(4)
        self.assertEqual(factory._config["warehouse"]["context"], 5)
        self.assertEqual(config["warehouse"]["model"], "smart")
        w.remove_tool("check_stock")
        w.disable_rule("check_before_order")
        self.assertNotIn("check_stock", factory._config["warehouse"]["tools"])

    def test_lesson_controls_available_mechanics_on_backend(self):
        c = deepcopy(self.c)
        c["lesson"]["mechanics"]["models"] = False
        g = Game(42, c)
        config = deepcopy(g.state["config"])
        config["warehouse"]["model"] = "cheap"
        with self.assertRaisesRegex(ValueError, "models"):
            g.configure(config)
        self.assertEqual(g.state["config"]["warehouse"]["model"], "smart")

    def test_starting_workshop_survives_day_one(self):
        for seed in range(40):
            with self.subTest(seed=seed):
                g = Game(seed, self.c)
                g.run_day()
                self.assertGreater(g.state["balance"], 0)
                self.assertEqual(g.state["status"], "playing")
                self.assertTrue(any(e["event"] == "overbuy" for e in g.state["events"]))
                self.assertTrue(any(e["event"] == "missing_inspection" for e in g.state["events"]))

    def test_three_strategies_complete_seven_days(self):
        # Diverse seeds exercise the full production path, not a single lucky game.
        for name in ("lean", "quality", "throughput"):
            for seed in (0, 7, 42, 123, 999):
                with self.subTest(strategy=name, seed=seed):
                    g = self.game(name, seed)
                    for day in range(7):
                        self.assertEqual(g.state["status"], "playing")
                        g.run_day()
                    self.assertEqual(g.state["status"], "won")
                    self.assertGreaterEqual(g.state["totals"]["units_sold"], 20)
                    self.assertGreater(g.state["balance"], 2500)
                    self.assertEqual(len(g.state["reports"]), 7)
                    with self.assertRaises(ValueError):
                        g.run_day()

    def test_recovery_after_bad_first_day(self):
        g = Game(4, self.c)
        g.run_day()
        self.assertGreater(g.state["balance"], 0)
        g.configure(strategy(self.c))
        for day in range(6):
            g.run_day()
        self.assertEqual(g.state["status"], "won")

    def test_determinism(self):
        a, b = self.game(), self.game()
        for day in range(7):
            a.run_day(); b.run_day()
        self.assertEqual(a.save(), b.save())

    def test_save_resume_json_round_trip(self):
        a = self.game()
        for day in range(3): a.run_day()
        b = Game(999, self.c)
        b.load(json.loads(json.dumps(a.save())))
        for day in range(4): a.run_day(); b.run_day()
        self.assertEqual(a.save(), b.save())

    def test_invalid_save_does_not_change_game(self):
        g = self.game(); g.run_day(); before = g.save()
        for corrupt in ("balance", "config", "reports", "inventory"):
            bad = deepcopy(before)
            bad["state"][corrupt] = None
            with self.assertRaises((ValueError, ConfigurationError)):
                g.load(bad)
            self.assertEqual(g.save(), before)

    def test_material_conservation_including_repairs(self):
        g = self.game(); g.run_day()
        recipe = self.c["products"]["robot_vacuum_basic"]["parts"]
        for p, n in recipe.items():
            ordered = sum(e["data"]["parts"].get(p, 0) for e in g.state["events"] if e["event"] == "parts_ordered")
            consumed = n * g.state["totals"]["units_started"] + (g.state["totals"]["reworks"] if p == "sensor" else 0)
            self.assertEqual(g.state["inventory"][p] + g.state["pending_delivery"][p], n * 6 + ordered - consumed)
        self.assertEqual(g.state["balance"], round(2500 + g.state["totals"]["profit"],2))

    def test_missing_essential_tool_stops_production(self):
        g = self.game()
        g.state["config"]["assembler"]["tools"].remove("assemble_vacuum")
        g.run_day()
        self.assertEqual(g.state["totals"]["units_started"], 0)
        self.assertEqual(g.state["inventory"]["frame"], 6)
        for day in range(2): g.run_day()
        self.assertEqual(g.state["status"], "lost")

    def test_missing_receive_tool_keeps_paid_delivery(self):
        g = Game(42, self.c)
        g.state["config"]["warehouse"]["tools"].remove("receive_delivery")
        g.run_day()
        self.assertGreater(g.state["pending_delivery"]["frame"], 0)
        self.assertGreater(g.state["totals"]["material_cost"],0)

    def test_rules_change_buying_behavior(self):
        a, b = self.game(), self.game()
        b.state["config"]["warehouse"]["rules"] = []
        a.run_day(); b.run_day()
        self.assertLess(a.state["totals"]["material_cost"], b.state["totals"]["material_cost"])

    def test_context_keeps_actual_events_and_changes_cost(self):
        a, b = self.game(), self.game()
        b.state["config"]["warehouse"]["context"] = 20
        a.run_day(); b.run_day()
        self.assertLess(a.state["worker_costs"]["warehouse"], b.state["worker_costs"]["warehouse"])
        self.assertTrue(b.state["memory"]["warehouse"])
        self.assertLessEqual(len(b.state["memory"]["warehouse"]),20)

    def test_defects_respond_to_quality(self):
        bad_defects = good_defects = 0
        for seed in range(30):
            a,b=self.game("quality",seed),self.game("lean",seed)
            b.state["config"]["assembler"]["model"]="cheap"
            b.state["config"]["assembler"]["rules"]=["prioritize_speed"]
            a.run_day();b.run_day()
            good_defects+=a.state["totals"]["defects"]
            bad_defects+=b.state["totals"]["defects"]
        self.assertGreater(bad_defects,good_defects)

    def test_bankruptcy_is_possible(self):
        g = Game(42, self.c)
        for w in g.state["config"].values():
            w["model"], w["context"] = "smart", 20
        g.state["config"]["warehouse"]["tools"].remove("issue_parts")
        while g.state["status"] == "playing": g.run_day()
        self.assertEqual(g.state["status"],"lost")
        self.assertLessEqual(g.state["balance"],0)

    def test_same_seed_comparison_equal_days_and_preserved_config(self):
        g = self.game();g.run_day();g.run_day()
        before=g.state["reports"][0]["profit"]
        g.new(42,keep_config=True);g.run_day()
        c=g.comparison()
        self.assertTrue(c["available"])
        self.assertEqual(c["days"],1)
        self.assertEqual(c["rows"][0]["before"],before)
        self.assertTrue(all(r["delta"]==0 for r in c["rows"]))
        g.new(41,keep_config=True)
        self.assertFalse(g.comparison()["available"])

    def test_restart_keeps_python_mode_but_lesson_reset_restores_auto(self):
        g = self.game()
        g.state["mode"] = "python"
        g.new(42, keep_config=True)
        self.assertEqual(g.state["mode"], "python")
        g.new(42)
        self.assertEqual(g.state["mode"], "auto")


class PythonTests(unittest.TestCase):
    def setUp(self):
        self.config=initial_config(load_content())

    def test_real_python_matches_auto_config(self):
        desired=strategy(load_content())
        lines=["def configure_factory(factory):"]
        for role,w in desired.items():
            lines.append(f"    worker = factory.worker({role!r})")
            for rule in self.config[role]["rules"]:lines.append(f"    worker.disable_rule({rule!r})")
            for tool in self.config[role]["tools"]:lines.append(f"    worker.remove_tool({tool!r})")
            for field in ("model","context","instructions"):lines.append(f"    worker.set_{field}({w[field]!r})")
            for rule in w["rules"]:lines.append(f"    worker.enable_rule({rule!r})")
            for tool in w["tools"]:lines.append(f"    worker.add_tool({tool!r})")
        result=check_code(self.config,"\n".join(lines))
        self.assertTrue(result["ok"],result)
        self.assertEqual(result["config"],desired)
        a,b=Game(42),Game(42)
        a.configure(desired);b.configure(result["config"])
        for day in range(7):a.run_day();b.run_day()
        self.assertEqual(a.save(),b.save())

    def test_syntax_and_runtime_errors_recover(self):
        r=check_code(self.config,"def configure_factory(factory):\n    factory.worker('warehouse').set_model('cheap'\n")
        self.assertFalse(r["ok"])
        self.assertEqual(r["error"],"SyntaxError")
        self.assertEqual(r["line"],2)
        r=check_code(self.config,"def configure_factory(factory):\n    x = 1 / 0\n")
        self.assertEqual(r["error"],"ZeroDivisionError")
        self.assertTrue(check_code(self.config,"def configure_factory(factory):\n    pass\n")["ok"])

    def test_unknown_tool_suggestion(self):
        r=check_code(self.config,"def configure_factory(factory):\n    factory.worker('warehouse').add_tool('check_stok')\n")
        self.assertFalse(r["ok"])
        self.assertIn("check_stock",r["message"])

    def test_timeout_and_recovery(self):
        r=check_code(self.config,"def configure_factory(factory):\n    while True: pass\n",timeout=.5)
        self.assertEqual(r["error"],"Timeout")
        self.assertTrue(check_code(self.config,"def configure_factory(factory):\n    pass\n")["ok"])

    def test_stdout_is_bounded(self):
        r=check_code(self.config,"def configure_factory(factory):\n    for i in range(500): print('x' * 100)\n")
        self.assertTrue(r["ok"])
        self.assertLessEqual(len(r["stdout"]),4000)

    def test_direct_economy_access_denied(self):
        r=check_code(self.config,"def configure_factory(factory):\n    factory.money=999999\n")
        self.assertFalse(r["ok"])


if __name__ == "__main__":
    unittest.main()
