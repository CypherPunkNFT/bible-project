import json
from .inputs import lease_status
if __name__=='__main__':print(json.dumps(lease_status(),indent=2))
