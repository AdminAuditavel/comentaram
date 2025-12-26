import os
from types import SimpleNamespace
from supabase import create_client

"""
Supabase client bootstrap

Behavior:
- If USE_SUPABASE_MOCK is set to '1'|'true'|'yes' (case-insensitive), a lightweight mock client
  will be used so pipelines / CI can run without real Supabase credentials.
- Otherwise, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or alternative keys) must be present
  in the environment and a real supabase client will be created.
"""

USE_MOCK = str(os.environ.get("USE_SUPABASE_MOCK", "")).lower() in ("1", "true", "yes")

if USE_MOCK:
    # Minimal mock supabase client to allow CI / local tests to run without credentials.
    # Extend methods as needed by your code (insert, select, from_, table, rpc, etc.).
    class _MockSupabase:
        def __init__(self):
            self._last = None
            self._last_payload = None

        # supabase.from_("table") style
        def from_(self, *args, **kwargs):
            self._last = ("from", args, kwargs)
            self._last_payload = None
            return self

        # alternate API: supabase.table("table")
        def table(self, *args, **kwargs):
            self._last = ("table", args, kwargs)
            self._last_payload = None
            return self

        def select(self, *args, **kwargs):
            self._last = ("select", args, kwargs)
            return self

        def eq(self, *args, **kwargs):
            self._last = ("eq", args, kwargs)
            return self

        def insert(self, payload, *args, **kwargs):
            # store payload so execute() can return it as .data
            self._last = ("insert", args, kwargs)
            self._last_payload = payload
            return self

        def upsert(self, payload, *args, **kwargs):
            self._last = ("upsert", args, kwargs)
            self._last_payload = payload
            return self

        def update(self, payload, *args, **kwargs):
            self._last = ("update", args, kwargs)
            self._last_payload = payload
            return self

        def delete(self, *args, **kwargs):
            self._last = ("delete", args, kwargs)
            self._last_payload = None
            return self

        # RPC (stored procedures)
        def rpc(self, name, *args, **kwargs):
            self._last = ("rpc", name, args, kwargs)
            self._last_payload = None
            return self

        # execute should return an object with a .data attribute (like real client)
        def execute(self):
            data = self._last_payload if self._last_payload is not None else []
            return SimpleNamespace(data=data, error=None, status_code=200)

        # helper to mimic direct calls like client.auth or similar if needed
        def __getattr__(self, name):
            # return a callable that returns an object with .data = None
            def _stub(*a, **k):
                return SimpleNamespace(data=None, error=None)
            return _stub

    supabase = _MockSupabase()
else:
    SUPABASE_URL = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("SUPABASE_KEY")
        or os.environ.get("SUPABASE_ANON_KEY")
    )

    if not SUPABASE_URL or not SUPABASE_KEY:
        raise RuntimeError("Supabase environment variables not set")

    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
