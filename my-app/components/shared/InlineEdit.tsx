"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => Promise<void> | void;
  onCancel?: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function InlineEdit({
  value,
  onSave,
  onCancel,
  placeholder = "Clique para editar",
  disabled = false,
  className,
  inputClassName,
  as: Component = "span",
}: InlineEditProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (disabled) return;
    setEditValue(value);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editValue.trim() === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editValue.trim());
      setIsEditing(false);
    } catch (error) {
      // Error handled by parent
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          className={cn("flex items-center gap-2", className)}
        >
          <Input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSave}
            disabled={isSaving}
            className={cn("flex-1", inputClassName)}
            placeholder={placeholder}
          />
          <div className="flex items-center gap-1">
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="p-1.5 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1.5 rounded-md hover:bg-red-100 text-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClick}
          className={cn(
            "cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors group",
            disabled && "cursor-default hover:bg-transparent",
            className
          )}
        >
          <Component className={cn("inline-flex items-center gap-2", !value && "text-muted-foreground italic")}>
            {value || placeholder}
            {!disabled && (
              <span className="opacity-0 group-hover:opacity-100 text-muted-foreground text-sm">
                ✎
              </span>
            )}
          </Component>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
