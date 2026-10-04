import unittest
from copy import deepcopy
from engine.game import Game
from test_engine import strategy
from test_server import HttpCase


class LiveSimulationTests(unittest.TestCase):
    def test_start_does_not_compute_day(self):
        g = Game(42)
        before = g.save()
        view = g.start_day()
        self.assertEqual(view["state"], before["state"])
        self.assertEqual(view["live"]["balance"], 2500)
        self.assertIsNone(view["live"]["scene"])
        self.assertEqual(view["state"]["reports"], [])

    def test_pause_and_duplicate_step_cannot_advance(self):
        g = Game(42)
        g.start_day(); g.step_day(0)
        before = g.view()
        g.step_day(0)
        self.assertEqual(g.view(), before)
        g.pause_day(True)
        paused = g.view()
        for i in range(5): g.step_day(1)
        self.assertEqual(g.view(), paused)
        g.pause_day(False); g.step_day(1)
        self.assertEqual(g.view()["live"]["scene"]["id"], 2)

    def test_economy_and_stock_change_at_actual_operations(self):
        g = Game(42); g.start_day()
        paid = delivered = built = sold = False
        while g.active:
            g.step_day()
            live = g.view()["live"]
            if not live: break
            kind = live["scene"]["kind"]
            if kind == "order_parts":
                self.assertEqual(live["inventory"]["frame"], 6)
                self.assertGreater(live["pending_delivery"]["frame"], 0)
                self.assertGreater(live["totals"]["material_cost"], 0)
                self.assertLess(live["balance"], 2500)
                paid = True
            if kind == "receive_delivery":
                self.assertTrue(paid)
                self.assertGreater(live["inventory"]["frame"], 6)
                self.assertEqual(live["pending_delivery"]["frame"], 0)
                delivered = True
            if kind == "assemble_vacuum":
                self.assertTrue(delivered)
                self.assertGreater(live["totals"]["units_started"], 0)
                built = True
            if kind == "product_sold":
                self.assertTrue(built)
                self.assertGreater(live["totals"]["revenue"], 0)
                sold = True
            self.assertEqual(g.state["reports"], [])
            self.assertEqual(g.state["day"], 0)
        self.assertTrue(paid and delivered and built and sold)
        self.assertEqual(g.state["day"], 1)
        self.assertEqual(len(g.state["reports"]), 1)

    def test_step_and_headless_results_are_identical_seven_days(self):
        a, b = Game(42), Game(42)
        config = strategy(a.content)
        a.configure(config); b.configure(config)
        for day in range(7):
            a.run_day(); b.start_day()
            while b.active: b.step_day(include_view=False)
            self.assertEqual(a.save(), b.save())
        self.assertEqual(b.state["status"], "won")

    def test_in_progress_configuration_save_load_and_new_day_rejected(self):
        g = Game(42); config = deepcopy(g.state["config"]); save = g.save()
        g.start_day()
        for operation in (lambda:g.configure(config), g.save, lambda:g.load(save), g.start_day, g.run_day):
            with self.assertRaises(ValueError): operation()
        g.new(42,keep_config=True)
        self.assertIsNone(g.active)
        self.assertEqual(g.save(),save)


class LiveHttpTests(HttpCase):
    def test_live_pause_reload_and_completion(self):
        result = self.request("/api/day/start", {})
        self.assertEqual(result["state"]["day"], 0)
        self.assertEqual(result["live"]["day"], 1)
        result = self.request("/api/day/step", {"expected_step":0})
        self.assertEqual(result["live"]["scene"]["id"], 1)
        self.request("/api/day/pause", {"paused":True})
        result = self.request("/api/day/step", {"expected_step":1})
        self.assertEqual(result["live"]["scene"]["id"], 1)
        self.assertTrue(self.request("/api/state")["live"]["paused"])
        self.request("/api/day/pause", {"paused":False})
        while result["live"]:
            result = self.request("/api/day/step", {"expected_step":result["live"]["scene"]["id"]})
        self.assertEqual(result["state"]["day"], 1)
        self.assertEqual(result["state"]["totals"]["units_sold"], 4)


if __name__ == "__main__":
    unittest.main()
