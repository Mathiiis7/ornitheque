#!/usr/bin/env node
/*
  zones-regroupees.mjs - Publie data/zones-regroupees.json : pour les 8 pays dont les fréquences sont
  mesurées sur des regroupements de zones (Royaume-Uni, Suisse, Hongrie, Slovénie, Lettonie, Moldavie,
  Monténégro, Macédoine du Nord), à quel regroupement appartient chaque zone eBird de la Carte.
  Sans elle, « Zone » restait grisé dans tout le Récent de ces pays (Mathis, 2026-10-28, Irlande du Nord).
  Source : la table parCommune de zones-agregees.json, celle qui a servi à agréger les fréquences.
  Usage : node outils/build/zones-regroupees.mjs
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const parCommune = JSON.parse(readFileSync(join(__dir, 'zones-agregees.json'), 'utf8')).parCommune;
const json = JSON.stringify(parCommune);
writeFileSync(join(__dir, '..', '..', 'data', 'zones-regroupees.json'), json);
console.log('data/zones-regroupees.json :', Object.keys(parCommune).join(', '), '-', (json.length / 1024).toFixed(1), 'Ko');
