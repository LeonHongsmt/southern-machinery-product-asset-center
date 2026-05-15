import React from "react";

export function LandingSection({
  id,
  eyebrow,
  title,
  description,
  className = "",
  children
}) {
  const h = React.createElement;

  return h(
    "section",
    {
      id,
      className: `landing-section${className ? ` ${className}` : ""}`
    },
    eyebrow
      ? h("p", { className: "landing-section-eyebrow" }, eyebrow)
      : null,
    title ? h("h2", { className: "landing-section-title" }, title) : null,
    description
      ? h("p", { className: "landing-section-description" }, description)
      : null,
    children
  );
}
