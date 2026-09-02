const no_typeof = {
  meta: {
    docs: { description: "Disallow runtime typeof checks" },
    messages: {
      noTypeof:
        "typeof is disallowed as per project RFC. No defensive coding, rely entirely on typescript's own type system. No workaround. If this reading from external source (unknown), instead focus on the happy path only and wrap the unknown part with try-catch block",
    },
  },
  create(context) {
    return {
      UnaryExpression(node) {
        if (node.operator === "typeof") {
          context.report({ node, messageId: "noTypeof" });
        }
      },
    };
  },
};

function isUndefinedish(node) {
  return (
    (node.type === "Identifier" &&
      (node.name === "undefined" || node.name === "null")) ||
    (node.type === "Literal" && node.value === null && node.raw === "null")
  );
}

function isNullCheck(node) {
  if (
    node.type !== "BinaryExpression" ||
    !["===", "==", "!==", "!="].includes(node.operator)
  ) {
    return null;
  }
  const { left, right } = node;
  if (left.type === "Identifier" && isUndefinedish(right)) return left.name;
  if (right.type === "Identifier" && isUndefinedish(left)) return right.name;
  return null;
}

function referencesMember(node, name) {
  let found = false;
  walk(node);
  return found;

  function walk(n) {
    if (found || n === null || typeof n !== "object") return;
    if (
      n.type === "MemberExpression" &&
      n.object.type === "Identifier" &&
      n.object.name === name
    ) {
      found = true;
      return;
    }
    for (const key of Object.keys(n)) {
      if (key === "parent") continue;
      const child = n[key];
      if (Array.isArray(child)) child.forEach(walk);
      else walk(child);
    }
  }
}

const no_manual_null_guard = {
  meta: {
    docs: {
      description:
        "Require optional chaining instead of x === undefined || x.prop guards",
    },
    messages: {
      useOptionalChain:
        "Use optional chaining instead: obj?.prop. Rewrite as a single expression.",
    },
  },
  create(context) {
    return {
      "LogicalExpression[operator=||]"(node) {
        const name = isNullCheck(node.left);
        if (name !== null && referencesMember(node.right, name)) {
          context.report({ node, messageId: "useOptionalChain" });
        }
      },
    };
  },
};

const plugin = {
  meta: { name: "gardena-custom" },
  rules: {
    "no-typeof": no_typeof,
    "no-manual-null-guard": no_manual_null_guard,
  },
};

export default plugin;
