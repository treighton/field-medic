import React from "react";

export function Card(props: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`card ${props.className ?? ""}`}>
      <header className="card__header">
        <h2 className="card__title">{props.title}</h2>
      </header>
      <div className="card__body">{props.children}</div>
    </section>
  );
}
