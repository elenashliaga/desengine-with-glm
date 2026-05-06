/* Component.tsx */
import React from 'react';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const DipoleCheckbox: React.FC<CheckboxProps> = ({ label, checked, onChange }) => {
  return (
    <div className="flex items-center">
      <div className="flex items-center cursor-pointer" onClick={onChange}>
        <div
          className={`w-4 h-4 border-2 border-gray-400 flex justify-center items-center ${checked ? 'bg-gray-400 border-transparent' : ''}`}
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
        >
          {checked && (
            <div className="w-2 h-2 bg-white" />
          )}
        </div>
        <div className="ml-2" style={{ width: '33%', height: '100%', display: 'flex', alignItems: 'center' }}>
          <span className="text-xs text-gray-700" style={{ fontFamily: 'Arial' }}>Label</span>
        </div>
      </div>
    </div>
  );
};

export default DipoleCheckbox;

// Note: Updated to use a square checkbox with shadow for the shadow effect, removed border-radius for square shape, and used a consistent gray background for checked state.
