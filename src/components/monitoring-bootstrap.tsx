"use client";

import { useEffect } from "react";

import { initializeClientMonitoring } from "@/lib/monitoring";

export function MonitoringBootstrap() {
  useEffect(() => {
    initializeClientMonitoring();
  }, []);

  return null;
}
