import pytest

from page_rules import strings_in, template_text


def test_colon_score_label_in_both_ternary_branches():
    source = 'const label = streak ? `Your best streak: ${best.streak}` : `Your best in Relaxed: ${best.relaxed}`;'
    assert {'Your best streak: {n}', 'Your best in Relaxed: {n}'} <= set(strings_in(source, '.tsx'))


@pytest.mark.parametrize('literal', ['hover:${color}', 'md:flex ${other}', 'bg-${color}',
                                    'hover:bg-${color}', '${size}px', 'text-red-500 ${extra}'])
def test_css_templates_stay_excluded(literal):
    assert template_text(literal) is None
