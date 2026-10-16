"""Encode the reviewed task XML for Windows Task Scheduler; no registration."""
from .settings import load


if __name__ == '__main__':
    path = load()['state_dir']/'native-supervisor/task.xml'
    raw = path.read_bytes()
    text = raw.decode('utf-16' if raw[:2] in (b'\xff\xfe', b'\xfe\xff') else 'utf-8-sig')
    text = text.replace('encoding="UTF-8"', 'encoding="UTF-16"')
    path.write_text(text, encoding='utf-16')
    print(path)
