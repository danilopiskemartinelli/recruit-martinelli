from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape

_TEMPLATES_DIR = Path(__file__).parent / "templates"

_env = Environment(
    loader=FileSystemLoader(str(_TEMPLATES_DIR)),
    autoescape=select_autoescape(["html"]),
)


def render_template(template_key: str, variables: dict) -> tuple[str, str]:
    """Returns (html, text) rendered pair."""
    html_tpl = _env.get_template(f"{template_key}.html")
    html = html_tpl.render(**variables)

    text_path = _TEMPLATES_DIR / f"{template_key}.txt"
    text = ""
    if text_path.exists():
        text_tpl = _env.get_template(f"{template_key}.txt")
        text = text_tpl.render(**variables)

    return html, text


def render_string(template_str: str, variables: dict) -> str:
    tpl = _env.from_string(template_str)
    return tpl.render(**variables)
