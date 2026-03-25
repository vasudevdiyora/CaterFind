import React from 'react';

const PageHeader = ({ title = 'Dashboard', subtitle = 'Welcome to your workspace', className = '' }) => {
    return (
        <div className={`min-w-0 ${className}`}>
            <h1 className="font-extrabold text-lg truncate tracking-tight">{title}</h1>
            {subtitle ? <p className="text-sm text-slate-600 mt-0.5 truncate">{subtitle}</p> : null}
        </div>
    );
};

export default PageHeader;
