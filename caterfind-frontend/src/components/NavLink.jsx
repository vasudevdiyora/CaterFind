/**
 * Custom NavLink component
 * Wraps react-router NavLink with additional styling support
 */
import { NavLink as RouterNavLink } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

/**
 * NavLink with active/pending class support
 * @param {object} props - Component props
 * @param {string} props.className - Base class names
 * @param {string} props.activeClassName - Class when link is active
 * @param {string} props.pendingClassName - Class when link is pending
 */
const NavLink = forwardRef(
    ({ className, activeClassName, pendingClassName, to, ...props }, ref) => {
        return (
            <RouterNavLink
                ref={ref}
                to={to}
                className={({ isActive, isPending }) =>
                    cn(className, isActive && activeClassName, isPending && pendingClassName)
                }
                {...props}
            />
        );
    },
);

NavLink.displayName = "NavLink";

export { NavLink };
