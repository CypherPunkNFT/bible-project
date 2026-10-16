"""Include the indexed query receipt in the existing exported examples artifact."""
from .inputs import OUT,read
from ..build import dump

def main():
 examples=read(OUT/'located-examples.json');examples['indexed_native_queries']=read(OUT/'fast-located-examples.json');dump(OUT/'located-examples.json',examples);print('Indexed query receipts included in located-examples.json')
if __name__=='__main__':main()
