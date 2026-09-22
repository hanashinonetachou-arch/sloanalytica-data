import test from 'node:test';import assert from 'node:assert/strict';import {informationGain7000Binomial} from '../tools/calculate-selection-ig-v8.mjs';
test('v8 binomial IG is deterministic and finite',()=>{const p=[1/243.3,1/237.6,1/225.7,1/199.4,1/185.1,1/176.8];const a=informationGain7000Binomial(p),b=informationGain7000Binomial(p);assert.equal(a,b);assert.ok(Number.isFinite(a)&&a>0);});
test('v8 binomial IG is zero for identical setting probabilities',()=>{const a=informationGain7000Binomial(Array(6).fill(.01));assert.ok(Math.abs(a)<1e-10);});
