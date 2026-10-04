import json
import threading
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError
from server import WorkshopServer
from test_engine import strategy


class HttpCase(unittest.TestCase):
    def setUp(self):
        self.server = WorkshopServer(seed=42)
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.url = f"http://127.0.0.1:{self.server.server_port}"
        self.token = self.server.token

    def tearDown(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=2)

    def request(self, path, data=None, token=True):
        headers = {"Content-Type":"application/json"}
        if token: headers["X-Workshop-Token"] = self.token
        request = Request(self.url+path, headers=headers,
                          data=json.dumps(data).encode() if data is not None else None)
        with urlopen(request, timeout=5) as result:
            return json.load(result)

class HttpTests(HttpCase):
    def test_full_seven_day_http_workflow(self):
        self.request("/api/config", {"config":strategy(self.server.game.content)})
        for day in range(1,8):
            result=self.request("/api/day",{})
            self.assertEqual(result["state"]["day"],day)
        self.assertEqual(result["state"]["status"],"won")
        self.assertTrue(result["state"]["events"])
        result=self.request("/api/restart",{"kind":"same"})
        self.assertEqual(result["state"]["seed"],42)
        result=self.request("/api/day",{})
        self.assertTrue(result["comparison"]["available"])
        self.assertTrue(all(r["delta"]==0 for r in result["comparison"]["rows"]))

    def test_python_check_apply_and_mode_lock(self):
        self.request("/api/mode",{"mode":"python"})
        result=self.request("/api/python/check",{})
        self.assertTrue(result["ok"],result)
        self.request("/api/python/apply",{})
        result=self.request("/api/day",{})
        self.assertEqual(result["state"]["python_days"],1)
        with self.assertRaises(HTTPError) as error:
            self.request("/api/config",{"config":strategy(self.server.game.content)})
        self.assertEqual(error.exception.code,400)
        error.exception.close()
        self.assertEqual(self.request("/api/state")["state"]["day"],1)

    def test_rejects_unapproved_commands_and_survives_bad_input(self):
        with self.assertRaises(HTTPError) as error:
            self.request("/api/day",{},token=False)
        self.assertEqual(error.exception.code,403)
        error.exception.close()
        with self.assertRaises(HTTPError) as error:
            self.request("/api/config",{"config": {"balance":999999}})
        error.exception.close()
        self.assertEqual(self.request("/api/state")["state"]["balance"],2500)
        self.assertEqual(self.request("/api/day",{})["state"]["day"],1)


if __name__ == "__main__":
    unittest.main()
