import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

const CustomCalendar = ({ label, value, onChange, name, required = false }) => {
    return (
        <div className="w-full">
            {label && (
                <label className="text-xs font-bold text-gray-400 mb-1 block uppercase">
                    {label}
                </label>
            )}
            <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors">
                    <CalendarIcon size={18} />
                </div>
                <input
                    type="date"
                    name={name}
                    required={required}
                    value={value}
                    onChange={onChange}
                    className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-600 rounded-lg text-white outline-none focus:border-primary transition-all cursor-pointer [color-scheme:dark]"
                />
            </div>
        </div>
    );
};

export default CustomCalendar;