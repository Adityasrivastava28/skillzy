declare module "react-simple-code-editor" {
  import type { CSSProperties } from "react";

  interface EditorProps {
    value: string;
    onValueChange: (value: string) => void;
    highlight: (value: string) => string;
    tabSize?: number;
    insertSpaces?: boolean;
    ignoreTabKey?: boolean;
    padding?: number | string;
    style?: CSSProperties;
    textareaId?: string;
    textareaClassName?: string;
    preClassName?: string;
    className?: string;
    autoFocus?: boolean;
    disabled?: boolean;
    placeholder?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onClick?: () => void;
  }

  export default function Editor(props: EditorProps): JSX.Element;
}
