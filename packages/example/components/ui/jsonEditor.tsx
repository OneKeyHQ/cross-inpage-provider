import React, { useState, useEffect } from 'react';
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';

export type JsonEditorProps = {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
};

export const JsonEditor = ({ value, placeholder, onChange }: JsonEditorProps) => {
  const [isJson, setIsJson] = useState(false);

  useEffect(() => {
    if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
      setIsJson(true);
    } else {
      setIsJson(false);
    }
  }, [value]);

  return (
    <CodeMirror
      className="text-sm overflow-auto max-h-[500px]"
      value={value}
      data-test="json-editor"
      placeholder={placeholder}
      extensions={[
        isJson ? json() : [],
        isJson ? linter(jsonParseLinter()) : [],
        isJson ? lintGutter() : [],
        EditorView.lineWrapping,
      ]}
      onChange={(value, viewUpdate) => {
        onChange(value);
      }}
      basicSetup={{ lineNumbers: false }}
      height="auto"
      theme="light"
    />
  );
};

export default JsonEditor;
