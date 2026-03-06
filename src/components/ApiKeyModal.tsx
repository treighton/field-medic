import { useState } from "react";

type Props = {
  isOpen: boolean;
  currentKey: string;
  onSave: (key: string) => void;
  onClose: () => void;
};

export function ApiKeyModal({ isOpen, currentKey, onSave, onClose }: Props) {
  const [value, setValue] = useState(currentKey);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(value.trim());
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal__title">Anthropic API Key</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Used for AI narrative generation. Stored in browser localStorage only — never sent anywhere except Anthropic's API.
        </p>
        <input
          className="modal__input"
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-..."
          autoFocus
          onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
        />
        <div className="modal__actions">
          <button onClick={handleSave}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
