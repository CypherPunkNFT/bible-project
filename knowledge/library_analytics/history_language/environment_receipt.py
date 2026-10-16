"""Record the exact local runtime without changing environments."""
import platform,sys,sqlite3
from lxml import etree
from .inputs import OUT
from ..build import dump

def main():
 receipt={'python':sys.version,'executable':sys.executable,'platform':platform.platform(),'sqlite':sqlite3.sqlite_version,'lxml':etree.LXML_VERSION,'libxml':etree.LIBXML_VERSION,'dependencies':['Python standard library','existing lxml'],'new_packages_installed':False,'embeddings_or_encoder':False}
 dump(OUT/'environment.json',receipt);print(receipt)
if __name__=='__main__':main()
