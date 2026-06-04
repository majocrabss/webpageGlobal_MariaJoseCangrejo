# Hypothesis Testing Tool — G11 Global Economics
**Term 3 · Learning Evidence 4 · C8–C10**
Teacher: Nicolás López Cuéllar
Student: María Cangrejo

---

## Live Demo
**https://majocrabss.github.io/webpageGlobal_MariaCangrejo/**

---

## How to Test C9 Mode with CSV Examples

### Mean-based test
1. Click the **C9** tab
2. Upload: `data/G11_T3_L4_C8C9_example_mean_data.csv`
3. Set **Data Type** → **Mean**
4. Set **Group Column** → `group`
5. Set **Value Column** → `score`
6. Set **Benchmark Group** → `rural`, **Test Group** → `urban`
7. Choose **Right-tailed**, α = 0.05
8. Click **Run Hypothesis Test**

Expected: z ≈ 4.4, p < 0.0001 → **Reject H₀**

### Proportion-based test
1. Click the **C9** tab
2. Upload: `data/G11_T3_L4_C8C9_example_proportion_data.csv`
3. Set **Data Type** → **Proportion**
4. Set **Group Column** → `group`
5. Set **Success Column** → `passed`
6. Set **Benchmark Group** → `program_b`, **Test Group** → `program_a`
7. Choose **Right-tailed**, α = 0.05
8. Click **Run Hypothesis Test**

Expected: z ≈ 3.0, p ≈ 0.0013 → **Reject H₀**

---

## Criteria Covered

| Criterion | Description |
|-----------|-------------|
| **C8** | Manual mode: sliders + input boxes, tail selector, normal curve, p-value, critical values, decision, Type I/II errors |
| **C9** | CSV upload, two-group detection, automatic hypothesis test, normal curve visualization |
| **C10** | Evidence-based report with APA citations — see C10 tab. Includes Download PDF button |
