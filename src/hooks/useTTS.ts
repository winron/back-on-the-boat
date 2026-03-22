"use client";

import { useEffect } from "react";
import { initVoices } from "@/lib/tts";

export function useTTS() {
  useEffect(() => {
    initVoices();
  }, []);
}
