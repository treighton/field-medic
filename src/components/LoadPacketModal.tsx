import { useState, useRef } from "react";
import type { ScenarioPacket } from "../types/scenario";
import { Card } from "./Card";

export function LoadPacketModal({
    isOpen,
    onLoad,
    onClose,
}: {
    isOpen: boolean;
    onLoad: (packet: ScenarioPacket) => void;
    onClose: () => void;
}) {
    const [jsonText, setJsonText] = useState("");
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const content = event.target?.result as string;
                setJsonText(content);
                setError("");
            } catch (err) {
                setError("Failed to read file");
            }
        };
        reader.readAsText(file);
    };

    const handleLoad = () => {
        try {
            const parsed = JSON.parse(jsonText) as ScenarioPacket;
            if (!parsed.meta || !parsed.hiddenInjuries) {
                throw new Error("Invalid packet structure");
            }
            onLoad(parsed);
            setJsonText("");
            setError("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid JSON");
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="modal-content">
                <Card title="Load Scenario Packet">
                    <div className="modal-body">
                        <div className="load-methods">
                            <div className="method">
                                <h3>Select JSON File</h3>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileSelect}
                                    className="file-input"
                                />
                            </div>

                            <div className="method">
                                <h3>Or Paste JSON</h3>
                                <textarea
                                    value={jsonText}
                                    onChange={(e) => {
                                        setJsonText(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="Paste a ScenarioPacket JSON object here..."
                                    className="json-textarea"
                                />
                            </div>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <div className="modal-actions">
                            <button onClick={handleLoad} disabled={!jsonText.trim()}>
                                Load Packet
                            </button>
                            <button onClick={onClose} className="secondary">
                                Cancel
                            </button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
