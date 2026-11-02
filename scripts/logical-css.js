// Builds every style rule in logical terms: margin-left becomes margin-inline-start, and so on. Left to right that is the
// same page; under dir="rtl" (Arabic, or a Hebrew Bible's text) the layout mirrors itself, with no page written twice, and
// a block marked dir="ltr" (a map) stays as drawn. left or right at 50% stays: it pairs with a -50% shift that cannot mirror.
const LOGICAL = {
  left: "inset-inline-start",
  right: "inset-inline-end",
  "margin-left": "margin-inline-start",
  "margin-right": "margin-inline-end",
  "padding-left": "padding-inline-start",
  "padding-right": "padding-inline-end",
  "border-left": "border-inline-start",
  "border-right": "border-inline-end",
  "border-left-width": "border-inline-start-width",
  "border-right-width": "border-inline-end-width",
  "border-left-color": "border-inline-start-color",
  "border-right-color": "border-inline-end-color",
  "border-left-style": "border-inline-start-style",
  "border-right-style": "border-inline-end-style",
  "border-top-left-radius": "border-start-start-radius",
  "border-top-right-radius": "border-start-end-radius",
  "border-bottom-left-radius": "border-end-start-radius",
  "border-bottom-right-radius": "border-end-end-radius",
  "scroll-margin-left": "scroll-margin-inline-start",
  "scroll-margin-right": "scroll-margin-inline-end",
  "scroll-padding-left": "scroll-padding-inline-start",
  "scroll-padding-right": "scroll-padding-inline-end",
};
const ALIGN = { left: "start", right: "end" };
// The short forms list the sides together ("padding: 0 12px 0 40px"), so a left and right that differ are split out too.
const SIDES = { margin: "margin", padding: "padding", inset: "inset" };

/** "0 calc(1px + 2px) 0 4px" as its four-or-fewer parts, keeping brackets whole. */
function parts(value) {
  const found = [];
  let depth = 0;
  let current = "";
  for (const letter of value.trim()) {
    if (letter === "(") depth++;
    if (letter === ")") depth--;
    if (letter === " " && depth === 0) {
      if (current) found.push(current);
      current = "";
    } else current += letter;
  }
  if (current) found.push(current);
  return found;
}

function splitSides(declaration, name) {
  const [top, right, bottom, left] = parts(declaration.value);
  if (left === undefined || left === right) return;
  declaration.cloneBefore({ prop: `${SIDES[name]}-block`, value: `${top} ${bottom}` });
  declaration.cloneBefore({ prop: `${SIDES[name]}-inline`, value: `${left} ${right}` });
  declaration.remove();
}

function splitCorners(declaration) {
  if (declaration.value.includes("/")) return;
  const list = parts(declaration.value);
  if (list.length < 2 || list.length > 4) return;
  const [topLeft, topRight, bottomRight = topLeft, bottomLeft = topRight] = list;
  if (topLeft === topRight && bottomLeft === bottomRight) return;
  declaration.cloneBefore({ prop: "border-start-start-radius", value: topLeft });
  declaration.cloneBefore({ prop: "border-start-end-radius", value: topRight });
  declaration.cloneBefore({ prop: "border-end-end-radius", value: bottomRight });
  declaration.cloneBefore({ prop: "border-end-start-radius", value: bottomLeft });
  declaration.remove();
}

const NAMED_IN_VALUE = /(^|[\s,])(left|right|margin-left|margin-right|padding-left|padding-right)(?=$|[\s,])/g;

export default function logicalCss() {
  return {
    postcssPlugin: "logical-css",
    Once(root) {
      root.walkDecls((declaration) => {
        const name = declaration.prop.toLowerCase();
        const value = declaration.value.trim().toLowerCase();
        if (name === "text-align") {
          if (ALIGN[value]) declaration.value = ALIGN[value];
        } else if (name === "float" || name === "clear") {
          // Older browsers lack inline-start here, so they keep the plain value written before it.
          if (ALIGN[value]) declaration.cloneAfter({ value: `inline-${ALIGN[value]}` });
        } else if (name === "transition" || name === "transition-property" || name === "will-change") {
          declaration.value = declaration.value.replace(NAMED_IN_VALUE, (_, before, word) => before + LOGICAL[word]);
        } else if (SIDES[name]) {
          splitSides(declaration, name);
        } else if (name === "border-radius") {
          splitCorners(declaration);
        } else if (LOGICAL[name] && value !== "50%") {
          declaration.prop = LOGICAL[name];
        }
      });
    },
  };
}
logicalCss.postcss = true;
