// Shim that maps the Instinct Files platform primitives onto react-router-dom,
// so the same src/App.tsx runs both on files.instinct.com and as a standalone app.
import React from 'react';

export { Link, NavLink, Route, Routes } from 'react-router-dom';

export function FileCard({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
