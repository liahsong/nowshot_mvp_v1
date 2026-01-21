import * as React from "react";

import { cn } from "../../lib/utils";

const SelectContext = React.createContext(null);

const extractText = (node) => {
  if (typeof node === "string" || typeof node === "number") {
    return node.toString();
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }
  if (React.isValidElement(node)) {
    return extractText(node.props.children);
  }
  return "";
};

function Select({ value, onValueChange, children }) {
  const [options, setOptions] = React.useState([]);
  const [placeholder, setPlaceholder] = React.useState("");

  const ctxValue = React.useMemo(
    () => ({
      value,
      onValueChange,
      options,
      setOptions,
      placeholder,
      setPlaceholder,
    }),
    [value, onValueChange, options, placeholder]
  );

  return <SelectContext.Provider value={ctxValue}>{children}</SelectContext.Provider>;
}

function SelectTrigger({ className, ...props }) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) return null;

  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-md border border-[#e5e5e5] bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#e5e5e5]",
        className
      )}
      value={ctx.value ?? ""}
      onChange={(event) => ctx.onValueChange?.(event.target.value)}
      {...props}
    >
      {ctx.placeholder ? (
        <option value="" disabled hidden>
          {ctx.placeholder}
        </option>
      ) : null}
      {ctx.options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function SelectContent({ children }) {
  const ctx = React.useContext(SelectContext);
  React.useEffect(() => {
    if (!ctx) return;
    const options = React.Children.toArray(children)
      .filter((child) => React.isValidElement(child))
      .map((child) => {
        const { value } = child.props || {};
        return {
          value,
          label: extractText(child.props?.children) || value,
        };
      })
      .filter((opt) => opt.value);
    ctx.setOptions((prev) => {
      if (
        prev.length === options.length &&
        prev.every(
          (item, index) =>
            item.value === options[index].value &&
            item.label === options[index].label
        )
      ) {
        return prev;
      }
      return options;
    });
  }, [children]);

  return null;
}

function SelectItem({ children }) {
  return <>{children}</>;
}

function SelectValue({ placeholder }) {
  const ctx = React.useContext(SelectContext);
  React.useEffect(() => {
    if (!ctx) return;
    ctx.setPlaceholder(placeholder || "");
  }, [placeholder]);
  return null;
}

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
