-- Migration: add scheduledTime column to visitsGPV
-- Run this in Supabase SQL Editor

ALTER TABLE "visitsGPV"
  ADD COLUMN IF NOT EXISTS "scheduledTime" text DEFAULT '09:00';
