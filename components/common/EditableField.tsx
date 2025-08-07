import React from 'react';

interface EditableFieldProps<T> {
  isEditing: boolean;
  value: T;
  onChange: (value: T) => void;
  label?: string;
  type?: 'text' | 'number' | 'textarea';
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  placeholder?: string;
}

const EditableField = <T extends string | number>({
  isEditing,
  value,
  onChange,
  label,
  type = 'text',
  className = '',
  inputClassName = '',
  labelClassName = '',
  placeholder = '',
}: EditableFieldProps<T>) => {

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = type === 'number' ? Number(e.target.value) : e.target.value;
    onChange(val as T);
  };

  return (
    <div className={className}>
      {label && <label className={`block text-sm font-medium text-gray-400 mb-1 ${labelClassName}`}>{label}</label>}
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={value}
            onChange={handleInputChange}
            className={`w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500 transition ${inputClassName}`}
            rows={2}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            value={value}
            onChange={handleInputChange}
            className={`w-full bg-gray-900 border border-gray-600 rounded-md p-2 text-white focus:ring-red-500 focus:border-red-500 transition ${inputClassName}`}
            placeholder={placeholder}
          />
        )
      ) : (
        <p className={`text-gray-200 ${inputClassName}`}>{value || placeholder}</p>
      )}
    </div>
  );
};

export default EditableField;