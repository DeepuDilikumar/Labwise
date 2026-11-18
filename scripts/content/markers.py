"""
Generates content/markers/*.json — the curated knowledge file the explainer paraphrases.
General, non-diagnostic educational content. EVERY entry needs clinical review before launch
(reviewedByDoctor: false). Unit factors convert TO the canonical (conventional) unit: canonical = a*x + b.
Critical thresholds are deliberately conservative and expressed in canonical units.
"""
import json, os
OUT = os.path.join(os.path.dirname(__file__), "..", "..", "content", "markers")
os.makedirs(OUT, exist_ok=True)

def U(unit, aliases=(), a=1.0, b=0.0):
    return {"unit": unit, "aliases": list(aliases), "a": a, "b": b}

M = []
def m(id, name, panel, canonical, si, units, synonyms, desc, high, low, questions, critical=None, decimals=1, siDecimals=None):
    M.append(dict(id=id, name=name, panel=panel, canonicalUnit=canonical, siUnit=si, units=units, synonyms=synonyms,
                  description=desc, reasonsHigh=high, reasonsLow=low, questions=questions, critical=critical,
                  decimals=decimals, siDecimals=siDecimals if siDecimals is not None else decimals, reviewedByDoctor=False))

# ---------------- Blood count ----------------
m("haemoglobin","Haemoglobin","cbc","g/dL","g/L",
  [U("g/dL",["gm/dl","g/dl","gm%","g%"]), U("g/L",["gm/l","g/l"],0.1), U("mmol/L",["mmol/l"],1.611)],
  ["hb","hgb","haemoglobin","hemoglobin","haemoglobin (hb)","hemoglobin (hgb)"],
  "Haemoglobin is the protein in red blood cells that carries oxygen from your lungs to the rest of your body.",
  ["Living at high altitude","Smoking","Not drinking enough fluids before the test"],
  ["Low iron, vitamin B12 or folate","Recent blood loss, including heavy periods","Pregnancy, which naturally dilutes the blood"],
  ["What might explain this haemoglobin result for me?","Would it help to check iron, B12 or folate?"],
  critical={"below":7.0,"above":20.0})
m("rbc","Red blood cell count","cbc","10^6/µL","10^12/L",
  [U("10^6/µL",["million/cumm","million/µl","mill/cumm","x10^6/ul","10^6/ul","m/ul","million/mm3","x10^6/µl"]), U("10^12/L",["x10^12/l","10^12/l","t/l"])],
  ["rbc","rbc count","red blood cell count","red cell count","erythrocytes","total rbc count","erythrocyte count"],
  "This counts how many red blood cells are in a small amount of blood. Red cells carry oxygen around the body.",
  ["Dehydration","Smoking","Living at high altitude"],
  ["Low iron or vitamins","Recent blood loss","Pregnancy"],
  ["How does my red cell count fit with my haemoglobin?"], decimals=2)
m("hematocrit","Haematocrit (PCV)","cbc","%","L/L",
  [U("%",["percent"]), U("L/L",["l/l"],100)],
  ["hct","pcv","haematocrit","hematocrit","packed cell volume","pcv (packed cell volume)"],
  "Haematocrit is the share of your blood made up of red blood cells.",
  ["Dehydration","Smoking","Living at high altitude"],
  ["Low iron or vitamins","Blood loss","Pregnancy"],
  ["Is my haematocrit in line with my other red cell results?"], siDecimals=2)
m("mcv","MCV (mean cell volume)","cbc","fL","fL",[U("fL",["fl","femtoliters","cu micron","µm3"])],
  ["mcv","mean corpuscular volume","mean cell volume"],
  "MCV shows the average size of your red blood cells. It helps doctors understand the type of any change in red cells.",
  ["Low vitamin B12 or folate","Alcohol use","Some medicines"],
  ["Low iron","Inherited differences in red cells, such as thalassaemia trait"],
  ["What does the size of my red cells tell you?"], decimals=0)
m("mch","MCH","cbc","pg","pg",[U("pg",["picograms"])],["mch","mean corpuscular haemoglobin","mean corpuscular hemoglobin"],
  "MCH is the average amount of haemoglobin inside each red blood cell.",
  ["Larger red cells, for example with low B12 or folate"],["Low iron","Inherited red cell differences"],
  ["Does my MCH change anything about what you'd look at next?"])
m("mchc","MCHC","cbc","g/dL","g/L",[U("g/dL",["g/dl","gm/dl","%"]), U("g/L",["g/l"],0.1)],
  ["mchc","mean corpuscular haemoglobin concentration","mean corpuscular hemoglobin concentration"],
  "MCHC shows how concentrated the haemoglobin is inside your red blood cells.",
  ["Some inherited red cell conditions","Sample handling effects"],["Low iron"],
  ["Is this MCHC result something we should look at again?"])
m("rdw","RDW","cbc","%","%",[U("%",["cv","rdw-cv"])],["rdw","rdw-cv","red cell distribution width","red cell distribution width (rdw)"],
  "RDW shows how much your red blood cells vary in size.",
  ["Mixed causes of red cell changes, such as low iron","Recent blood loss or treatment for anaemia"],
  ["Usually not a concern on its own"],["What could cause my red cells to vary in size?"])
m("wbc","White blood cell count","cbc","10^3/µL","10^9/L",
  [U("10^3/µL",["x10^3/ul","10^3/ul","thou/µl","k/µl","k/ul","x10^3/µl","10^3/µl"]), U("10^9/L",["x10^9/l","10^9/l","g/l"]), U("/µL",["/cumm","cells/cumm","/ul","/µl","cells/µl","/mm3"],0.001)],
  ["wbc","tlc","total leucocyte count","total leukocyte count","white blood cell count","white cell count","total wbc count","leukocytes","wbc count"],
  "White blood cells are part of your immune system. They help the body fight infections.",
  ["A recent infection or inflammation","Physical or emotional stress","Smoking","Some medicines, such as steroids"],
  ["Some viral infections","Some medicines","Naturally lower counts in some healthy people"],
  ["Could a recent illness explain this result?","Should this be repeated once I'm well?"],
  critical={"below":1.5,"above":30.0})
m("neutrophils","Neutrophils","cbc","%","%",[U("%",["percent"])],["neutrophils","neutrophil","polymorphs","neutrophils %","segmented neutrophils","neut%"],
  "Neutrophils are the most common type of white blood cell. They are often the first to respond to bacterial infections.",
  ["A bacterial infection","Physical stress","Some medicines, such as steroids"],
  ["Some viral infections","Some medicines"],["Is my neutrophil level linked to a recent infection?"], decimals=0)
m("lymphocytes","Lymphocytes","cbc","%","%",[U("%",["percent"])],["lymphocytes","lymphocyte","lymphs","lymphocytes %","lymph%"],
  "Lymphocytes are white blood cells that help the body remember and fight infections, especially viruses.",
  ["A recent viral infection"],["Physical stress","Some medicines, such as steroids"],
  ["Could a recent viral illness explain this?"], decimals=0)
m("platelets","Platelet count","cbc","10^3/µL","10^9/L",
  [U("10^3/µL",["x10^3/ul","10^3/ul","thou/µl","k/µl","k/ul","x10^3/µl","10^3/µl"]), U("10^9/L",["x10^9/l","10^9/l"]), U("lakh/cumm",["lakhs/cumm","lakh/µl","lakhs/µl","lakh/mm3","lakhs"],100), U("/µL",["/cumm","cells/cumm","/ul","/µl","/mm3"],0.001)],
  ["platelets","platelet count","plt","thrombocytes","platelet"],
  "Platelets are tiny cell pieces that help your blood clot and stop bleeding.",
  ["Recent infection or inflammation","Low iron","Recovery after blood loss"],
  ["Some viral infections, including dengue in some regions","Some medicines","Clumping of platelets in the sample tube"],
  ["Should my platelet count be checked again?","Is there anything I should watch out for, like unusual bruising?"],
  critical={"below":20.0,"above":1000.0}, decimals=0)
m("esr","ESR","inflammation","mm/hr","mm/hr",[U("mm/hr",["mm/h","mm/1st hr","mm in 1st hr","mm/hour","mm/1 hr"])],
  ["esr","erythrocyte sedimentation rate","sed rate","esr (westergren)"],
  "ESR is a general sign of inflammation in the body. It doesn't point to any one cause on its own.",
  ["A recent infection or inflammation","Older age, which naturally raises ESR","Pregnancy","Low haemoglobin"],
  ["Usually not a concern"],["What might be causing inflammation, if anything?"], decimals=0)

# ---------------- Blood sugar ----------------
GL = [U("mg/dL",["mg/dl","mg %","mg%"]), U("mmol/L",["mmol/l"],18.016)]
m("glucose_fasting","Fasting blood sugar","blood_sugar","mg/dL","mmol/L",GL,
  ["fasting blood sugar","fbs","fasting glucose","glucose fasting","glucose (fasting)","fasting plasma glucose","fpg","blood sugar fasting","glucose, fasting","plasma glucose fasting"],
  "This measures the sugar (glucose) in your blood after not eating for 8 to 12 hours.",
  ["Eating or drinking something sweet before the test","Stress or a recent illness","Some medicines, such as steroids","How your body is handling sugar over time"],
  ["Fasting for a long time","Some diabetes medicines","Intense exercise before the test"],
  ["What does this fasting sugar mean for me?","Should we check my HbA1c too?"],
  critical={"below":54.0,"above":400.0}, decimals=0)
m("glucose_pp","Blood sugar after a meal (PP)","blood_sugar","mg/dL","mmol/L",GL,
  ["post prandial blood sugar","ppbs","pp blood sugar","glucose post prandial","post-prandial glucose","glucose (pp)","2 hr post prandial glucose","postprandial glucose","glucose pp"],
  "This measures blood sugar about two hours after a meal, to see how your body handles sugar from food.",
  ["A large or sugary meal before the test","Stress or illness","How your body is handling sugar over time"],
  ["A very small meal","Some diabetes medicines"],
  ["How does my after-meal sugar compare with my fasting sugar?"], critical={"below":54.0,"above":400.0}, decimals=0)
m("glucose_random","Random blood sugar","blood_sugar","mg/dL","mmol/L",GL,
  ["random blood sugar","rbs","random glucose","glucose random","glucose (random)","glucose","blood glucose","plasma glucose"],
  "This measures blood sugar at any time of day, whether or not you have eaten.",
  ["Eating shortly before the test","Stress or illness","Some medicines"],["Not eating for a long time","Some diabetes medicines"],
  ["Should I have a fasting sugar or HbA1c test as well?"], critical={"below":54.0,"above":400.0}, decimals=0)
m("hba1c","HbA1c","blood_sugar","%","mmol/mol",
  [U("%",["percent","% of total hb","%hb"]), U("mmol/mol",["mmol/mol"],0.09148,2.152)],
  ["hba1c","glycated haemoglobin","glycated hemoglobin","glycosylated haemoglobin","glycosylated hemoglobin","a1c","hemoglobin a1c","haemoglobin a1c","hba1c (glycated haemoglobin)"],
  "HbA1c shows your average blood sugar over roughly the last two to three months.",
  ["Higher blood sugar over recent months","Some types of anaemia or low iron can raise the reading"],
  ["Recent blood loss or a blood transfusion","Some types of anaemia","Some inherited haemoglobin differences"],
  ["What does this number mean for me, given my history?","Should this be checked again, and when?"], siDecimals=0)

# ---------------- Lipids ----------------
CH = [U("mg/dL",["mg/dl","mg %"]), U("mmol/L",["mmol/l"],38.67)]
m("cholesterol_total","Total cholesterol","lipids","mg/dL","mmol/L",CH,
  ["total cholesterol","cholesterol","cholesterol total","serum cholesterol","cholesterol, total","s. cholesterol"],
  "Total cholesterol is the overall amount of cholesterol in your blood, including the 'good' and 'bad' kinds.",
  ["Diet high in saturated fat","Family history","Less physical activity","Some medicines or an underactive thyroid"],
  ["Some medicines","Recent illness","Overactive thyroid"],
  ["How do my cholesterol numbers look together?","What would you suggest we keep an eye on?"], decimals=0, siDecimals=2)
m("ldl","LDL cholesterol","lipids","mg/dL","mmol/L",CH,
  ["ldl","ldl cholesterol","ldl-c","low density lipoprotein","ldl cholesterol (direct)","ldl (calculated)","ldl cholesterol, calculated","direct ldl"],
  "LDL is often called 'bad' cholesterol because higher levels can build up in blood vessels over time.",
  ["Diet high in saturated fat","Family history","Less physical activity","An underactive thyroid"],
  ["Some cholesterol medicines","Overactive thyroid"],
  ["What LDL level would you like me to aim for?","How does my LDL fit with my overall heart health?"], decimals=0, siDecimals=2)
m("hdl","HDL cholesterol","lipids","mg/dL","mmol/L",CH,
  ["hdl","hdl cholesterol","hdl-c","high density lipoprotein","hdl cholesterol (direct)","direct hdl"],
  "HDL is often called 'good' cholesterol because it helps carry cholesterol away from blood vessels.",
  ["Regular physical activity","Family history"],["Less physical activity","Smoking","Being overweight","Some medicines"],
  ["Is there anything about my HDL you'd like me to know?"], decimals=0, siDecimals=2)
m("triglycerides","Triglycerides","lipids","mg/dL","mmol/L",[U("mg/dL",["mg/dl","mg %"]), U("mmol/L",["mmol/l"],88.57)],
  ["triglycerides","tg","triglyceride","serum triglycerides","trigs"],
  "Triglycerides are a type of fat in the blood that comes from food and is stored for energy.",
  ["Eating shortly before the test","Alcohol","Diet high in sugar or refined carbohydrates","Some medicines"],
  ["Usually not a concern"],["Was I meant to fast for this test?","How do my triglycerides fit with my other results?"],
  critical={"above":1000.0}, decimals=0, siDecimals=2)
m("vldl","VLDL cholesterol","lipids","mg/dL","mmol/L",CH,["vldl","vldl cholesterol","very low density lipoprotein"],
  "VLDL carries mostly triglycerides in the blood. On many reports it is calculated from triglycerides.",
  ["Higher triglycerides"],["Usually not a concern"],["Do I need to think about VLDL separately from triglycerides?"], decimals=0, siDecimals=2)
m("non_hdl","Non-HDL cholesterol","lipids","mg/dL","mmol/L",CH,["non-hdl cholesterol","non hdl cholesterol","non-hdl"],
  "Non-HDL cholesterol is your total cholesterol minus HDL. It includes all the types that can build up in blood vessels.",
  ["Higher LDL or triglycerides"],["Usually not a concern"],["How does my non-HDL number compare to my LDL?"], decimals=0, siDecimals=2)

# ---------------- Kidney ----------------
m("creatinine","Creatinine","kidney","mg/dL","µmol/L",[U("mg/dL",["mg/dl","mg %"]), U("µmol/L",["umol/l","µmol/l","micromol/l"],1/88.42)],
  ["creatinine","serum creatinine","s. creatinine","creatinine, serum","creat"],
  "Creatinine is a waste product from muscles. Your kidneys filter it out, so it helps show how well they are working.",
  ["Not drinking enough fluids","More muscle mass or heavy exercise","Eating a lot of meat before the test","Some medicines"],
  ["Less muscle mass","Pregnancy"],["What does this creatinine result say about my kidneys?","Should my kidney tests be repeated?"],
  critical={"above":5.0}, decimals=2, siDecimals=0)
m("urea","Urea","kidney","mg/dL","mmol/L",[U("mg/dL",["mg/dl","mg %"]), U("mmol/L",["mmol/l"],6.006)],
  ["urea","blood urea","serum urea","s. urea","urea, serum"],
  "Urea is a waste product made when the body breaks down protein. The kidneys remove it from the blood.",
  ["Not drinking enough fluids","A high-protein diet","Some medicines"],["Low-protein diet","Liver changes","Pregnancy"],
  ["Is my urea result linked to how much water I drink?"], decimals=0)
m("bun","Blood urea nitrogen (BUN)","kidney","mg/dL","mmol/L",[U("mg/dL",["mg/dl"]), U("mmol/L",["mmol/l"],2.801)],
  ["bun","blood urea nitrogen","urea nitrogen","bun (blood urea nitrogen)"],
  "BUN measures the nitrogen from urea in your blood. The kidneys remove urea, so it helps show how they are working.",
  ["Not drinking enough fluids","A high-protein diet","Some medicines"],["Low-protein diet","Liver changes"],
  ["How does my BUN fit with my creatinine?"], decimals=0)
m("egfr","eGFR","kidney","mL/min/1.73m²","mL/min/1.73m²",[U("mL/min/1.73m²",["ml/min/1.73m2","ml/min/1.73 m2","ml/min/1.73m²","ml/min","ml/min/1.73 sq m"])],
  ["egfr","estimated gfr","estimated glomerular filtration rate","gfr","egfr (ckd-epi)"],
  "eGFR is an estimate of how well your kidneys filter blood, worked out from your creatinine, age and sometimes sex.",
  ["Usually not a concern"],["Not drinking enough fluids","Older age","Changes in kidney function"],
  ["What does my eGFR mean for my kidneys?","Should we track this over time?"], decimals=0)
m("uric_acid","Uric acid","kidney","mg/dL","µmol/L",[U("mg/dL",["mg/dl"]), U("µmol/L",["umol/l","µmol/l"],1/59.48)],
  ["uric acid","serum uric acid","s. uric acid","urate"],
  "Uric acid is a waste product made when the body breaks down substances called purines, found in some foods and drinks.",
  ["Diet rich in red meat, seafood or sugary drinks","Alcohol","Not drinking enough fluids","Some medicines"],
  ["Usually not a concern"],["Is there anything about my uric acid level you'd like me to know?"], siDecimals=0)

# ---------------- Liver ----------------
m("alt","ALT (SGPT)","liver","U/L","U/L",[U("U/L",["iu/l","u/l","units/l"])],
  ["alt","sgpt","alanine aminotransferase","alt (sgpt)","sgpt (alt)","alanine transaminase"],
  "ALT is an enzyme found mostly in the liver. Higher levels in the blood can show the liver is under some strain.",
  ["Some medicines or supplements","Alcohol","Fatty liver","A recent viral illness","Intense exercise"],
  ["Usually not a concern"],["What might be raising my liver enzymes?","Should this be checked again?"], critical={"above":1000.0}, decimals=0)
m("ast","AST (SGOT)","liver","U/L","U/L",[U("U/L",["iu/l","u/l","units/l"])],
  ["ast","sgot","aspartate aminotransferase","ast (sgot)","sgot (ast)","aspartate transaminase"],
  "AST is an enzyme found in the liver, muscles and other organs.",
  ["Some medicines","Alcohol","Liver strain","Recent muscle injury or intense exercise"],["Usually not a concern"],
  ["How do my AST and ALT look together?"], critical={"above":1000.0}, decimals=0)
m("alp","Alkaline phosphatase (ALP)","liver","U/L","U/L",[U("U/L",["iu/l","u/l"])],
  ["alp","alkaline phosphatase","alk phos","alkaline phosphatase (alp)"],
  "ALP is an enzyme found in the liver and bones.",
  ["Normal bone growth in teenagers","Pregnancy","Bone or bile duct changes"],["Low zinc or magnesium","Some inherited conditions"],
  ["Could my ALP be coming from bone or liver?"], decimals=0)
m("ggt","GGT","liver","U/L","U/L",[U("U/L",["iu/l","u/l"])],["ggt","gamma gt","gamma-glutamyl transferase","ggtp","gamma glutamyl transpeptidase"],
  "GGT is a liver enzyme. It is often looked at together with ALP.",
  ["Alcohol","Some medicines","Fatty liver"],["Usually not a concern"],["What could be raising my GGT?"], decimals=0)
BIL = [U("mg/dL",["mg/dl"]), U("µmol/L",["umol/l","µmol/l"],1/17.1)]
m("bilirubin_total","Total bilirubin","liver","mg/dL","µmol/L",BIL,
  ["total bilirubin","bilirubin total","bilirubin, total","s. bilirubin total","bilirubin (total)","t. bilirubin","bilirubin"],
  "Bilirubin is a yellow substance made when old red blood cells break down. The liver clears it from the body.",
  ["Gilbert's syndrome, a common harmless inherited trait","Fasting","Faster breakdown of red cells","Liver or bile duct changes"],
  ["Usually not a concern"],["Is my bilirubin level something to look into further?"], decimals=2, siDecimals=0)
m("bilirubin_direct","Direct bilirubin","liver","mg/dL","µmol/L",BIL,
  ["direct bilirubin","bilirubin direct","conjugated bilirubin","bilirubin, direct","d. bilirubin","bilirubin (direct)"],
  "Direct bilirubin is the form of bilirubin that has been processed by the liver.",
  ["Liver or bile duct changes","Some medicines"],["Usually not a concern"],["What does my direct bilirubin show?"], decimals=2, siDecimals=0)
m("albumin","Albumin","liver","g/dL","g/L",[U("g/dL",["g/dl","gm/dl"]), U("g/L",["g/l"],0.1)],
  ["albumin","serum albumin","s. albumin","albumin, serum"],
  "Albumin is a protein made by the liver. It helps keep fluid in your blood vessels and carries substances around the body.",
  ["Not drinking enough fluids"],["Low protein in the diet","Liver or kidney changes","Recent illness or inflammation"],
  ["What might explain my albumin level?"], siDecimals=0)
m("total_protein","Total protein","liver","g/dL","g/L",[U("g/dL",["g/dl","gm/dl"]), U("g/L",["g/l"],0.1)],
  ["total protein","protein total","serum total protein","proteins, total","total proteins"],
  "Total protein measures albumin and other proteins in your blood together.",
  ["Not drinking enough fluids","Long-term inflammation"],["Low protein in the diet","Liver or kidney changes"],
  ["How do my protein results fit together?"], siDecimals=0)

# ---------------- Thyroid ----------------
m("tsh","TSH (thyroid stimulating hormone)","thyroid","µIU/mL","mIU/L",[U("µIU/mL",["uiu/ml","µiu/ml","µu/ml","uu/ml","miu/ml"]), U("mIU/L",["miu/l","mu/l"])],
  ["tsh","thyroid stimulating hormone","tsh (ultrasensitive)","ultrasensitive tsh","tsh 3rd generation","thyrotropin","s. tsh"],
  "TSH is a hormone from the pituitary gland in the brain. It tells the thyroid how much thyroid hormone to make.",
  ["The thyroid making less hormone than the body needs","Recovering from an illness","Some medicines"],
  ["The thyroid making more hormone than the body needs","Some medicines, including thyroid medicine","Early pregnancy"],
  ["What does my TSH tell you about my thyroid?","Should we check my free T4 as well?"], decimals=2)
m("free_t4","Free T4","thyroid","ng/dL","pmol/L",[U("ng/dL",["ng/dl"]), U("pmol/L",["pmol/l"],1/12.87)],
  ["free t4","ft4","free thyroxine","t4 free","thyroxine free","free t4 (ft4)"],
  "Free T4 is the active form of the main hormone made by your thyroid.",
  ["The thyroid making more hormone","Thyroid medicine taken shortly before the test"],["The thyroid making less hormone"],
  ["How do my free T4 and TSH look together?"], decimals=2)
m("free_t3","Free T3","thyroid","pg/mL","pmol/L",[U("pg/mL",["pg/ml"]), U("pmol/L",["pmol/l"],1/1.536)],
  ["free t3","ft3","free triiodothyronine","t3 free"],
  "Free T3 is another thyroid hormone. It is the most active form in the body.",
  ["The thyroid making more hormone"],["Recent illness","The thyroid making less hormone"],
  ["Is my free T3 important to look at in my case?"], decimals=2)
m("t3_total","Total T3","thyroid","ng/dL","nmol/L",[U("ng/dL",["ng/dl"]), U("ng/mL",["ng/ml"],100), U("nmol/L",["nmol/l"],65.1)],
  ["t3","total t3","triiodothyronine","t3 total","total triiodothyronine"],
  "Total T3 measures all the T3 thyroid hormone in your blood, both bound to proteins and free.",
  ["The thyroid making more hormone","Pregnancy or some medicines that raise binding proteins"],["Recent illness","The thyroid making less hormone"],
  ["Should we look at free hormone levels instead?"], decimals=0)
m("t4_total","Total T4","thyroid","µg/dL","nmol/L",[U("µg/dL",["ug/dl","µg/dl","mcg/dl"]), U("nmol/L",["nmol/l"],1/12.87)],
  ["t4","total t4","thyroxine","t4 total","total thyroxine"],
  "Total T4 measures all the T4 thyroid hormone in your blood, both bound to proteins and free.",
  ["The thyroid making more hormone","Pregnancy or some medicines that raise binding proteins"],["The thyroid making less hormone"],
  ["Should we look at free T4 instead?"], decimals=1)

# ---------------- Vitamins ----------------
m("vitamin_d","Vitamin D (25-OH)","vitamins","ng/mL","nmol/L",[U("ng/mL",["ng/ml"]), U("nmol/L",["nmol/l"],1/2.496)],
  ["vitamin d","25-oh vitamin d","25 hydroxy vitamin d","vitamin d (25-oh)","25(oh)d","vitamin d3","vitamin d total","25-hydroxyvitamin d","vit d"],
  "This measures the main stored form of vitamin D. Vitamin D helps your body use calcium and keep bones strong.",
  ["Taking vitamin D supplements"],["Little time in sunlight","Darker skin, which makes less vitamin D from sunlight","Diet low in vitamin D"],
  ["What range does your clinic use for vitamin D?","Is my vitamin D level something to act on?"], decimals=1, siDecimals=0)
m("vitamin_b12","Vitamin B12","vitamins","pg/mL","pmol/L",[U("pg/mL",["pg/ml","ng/l"]), U("pmol/L",["pmol/l"],1/0.7378)],
  ["vitamin b12","b12","cobalamin","vit b12","cyanocobalamin","serum vitamin b12"],
  "Vitamin B12 helps make red blood cells and keeps nerves healthy.",
  ["Taking B12 supplements or injections"],["A vegetarian or vegan diet","Some medicines, such as metformin or acid-reducing tablets","Lower absorption with age"],
  ["Is my B12 level something to act on?"], decimals=0)

# ---------------- Iron ----------------
m("iron","Serum iron","iron","µg/dL","µmol/L",[U("µg/dL",["ug/dl","µg/dl","mcg/dl"]), U("µmol/L",["umol/l","µmol/l"],5.585)],
  ["iron","serum iron","s. iron","iron, serum","fe"],
  "Serum iron measures the iron circulating in your blood. It can change a lot during the day and after meals.",
  ["Iron supplements or a recent iron-rich meal"],["Low iron intake","Blood loss, including heavy periods","Recent illness or inflammation"],
  ["How does my iron fit with my ferritin?"], decimals=0)
m("ferritin","Ferritin","iron","ng/mL","µg/L",[U("ng/mL",["ng/ml"]), U("µg/L",["ug/l","µg/l"])],
  ["ferritin","serum ferritin","s. ferritin"],
  "Ferritin shows how much iron your body has stored.",
  ["Inflammation or a recent infection","Alcohol","Liver changes"],["Low iron stores","Blood loss, including heavy periods"],
  ["Do my iron stores need attention?"], decimals=0)
m("tibc","TIBC","iron","µg/dL","µmol/L",[U("µg/dL",["ug/dl","µg/dl","mcg/dl"]), U("µmol/L",["umol/l","µmol/l"],5.585)],
  ["tibc","total iron binding capacity"],
  "TIBC shows how much iron your blood is able to carry. It often rises when iron stores are low.",
  ["Low iron stores","Pregnancy"],["Inflammation","Liver changes"],["What does my TIBC add to the picture?"], decimals=0)
m("transferrin_sat","Transferrin saturation","iron","%","%",[U("%",["percent"])],
  ["transferrin saturation","tsat","iron saturation","% saturation","percent saturation"],
  "Transferrin saturation shows how much of your blood's iron-carrying capacity is being used.",
  ["Iron supplements","Some inherited conditions that affect iron"],["Low iron stores"],["How do my iron results fit together?"], decimals=0)

# ---------------- Electrolytes & minerals ----------------
m("sodium","Sodium","electrolytes","mmol/L","mmol/L",[U("mmol/L",["mmol/l","meq/l"])],["sodium","na","na+","serum sodium","s. sodium"],
  "Sodium is a salt that helps control fluid balance, nerves and muscles.",
  ["Not drinking enough fluids","Losing fluids through sweating or diarrhoea"],["Drinking a lot of water","Some medicines, such as water tablets","Vomiting or diarrhoea"],
  ["What might be affecting my sodium?"], critical={"below":120.0,"above":160.0}, decimals=0)
m("potassium","Potassium","electrolytes","mmol/L","mmol/L",[U("mmol/L",["mmol/l","meq/l"])],["potassium","k","k+","serum potassium","s. potassium"],
  "Potassium is a mineral that helps your nerves, muscles and heart work properly.",
  ["Some medicines","Kidney changes","Sample handling, such as a delay before testing"],["Vomiting or diarrhoea","Some medicines, such as water tablets"],
  ["Should my potassium be rechecked?"], critical={"below":2.8,"above":6.2}, decimals=1)
m("chloride","Chloride","electrolytes","mmol/L","mmol/L",[U("mmol/L",["mmol/l","meq/l"])],["chloride","cl","cl-","serum chloride"],
  "Chloride is a salt that works with sodium to balance fluids in the body.",
  ["Not drinking enough fluids","Diarrhoea"],["Vomiting","Some medicines"],["How do my salts look together?"], decimals=0)
m("calcium","Calcium","electrolytes","mg/dL","mmol/L",[U("mg/dL",["mg/dl"]), U("mmol/L",["mmol/l"],4.008)],
  ["calcium","serum calcium","total calcium","ca","s. calcium","calcium, total"],
  "Calcium is a mineral that keeps bones and teeth strong and helps muscles and nerves work.",
  ["Calcium or vitamin D supplements","Not drinking enough fluids","Changes in the glands that control calcium"],
  ["Low vitamin D","Low albumin, which affects the reading","Some medicines"],
  ["Should my calcium be adjusted for my albumin?"], critical={"below":6.5,"above":13.0}, decimals=1, siDecimals=2)
m("magnesium","Magnesium","electrolytes","mg/dL","mmol/L",[U("mg/dL",["mg/dl"]), U("mmol/L",["mmol/l"],2.431)],
  ["magnesium","serum magnesium","mg","s. magnesium"],
  "Magnesium is a mineral that helps muscles, nerves and energy use.",
  ["Some supplements or antacids","Kidney changes"],["Some medicines, such as acid-reducing tablets","Alcohol","Diarrhoea"],
  ["Is my magnesium level linked to any of my medicines?"], decimals=1, siDecimals=2)
m("phosphorus","Phosphorus","electrolytes","mg/dL","mmol/L",[U("mg/dL",["mg/dl"]), U("mmol/L",["mmol/l"],3.097)],
  ["phosphorus","phosphate","inorganic phosphorus","serum phosphorus"],
  "Phosphorus is a mineral that works with calcium to build bones and teeth.",
  ["Kidney changes","Normal bone growth in children"],["Low vitamin D","Some antacids"],["How does my phosphorus fit with my calcium?"], decimals=1, siDecimals=2)

# ---------------- Inflammation ----------------
m("crp","CRP (C-reactive protein)","inflammation","mg/L","mg/L",[U("mg/L",["mg/l"]), U("mg/dL",["mg/dl"],10)],
  ["crp","c-reactive protein","c reactive protein","crp (quantitative)","crp quantitative"],
  "CRP is a protein the liver makes when there is inflammation in the body.",
  ["A recent infection or injury","Long-term inflammation","Being overweight or smoking"],["Usually not a concern"],
  ["What might be causing inflammation, if anything?","Should CRP be repeated once I'm well?"])
m("hs_crp","hs-CRP","inflammation","mg/L","mg/L",[U("mg/L",["mg/l"]), U("mg/dL",["mg/dl"],10)],
  ["hs-crp","hscrp","high sensitivity crp","high-sensitivity c-reactive protein","hs crp"],
  "hs-CRP measures low levels of inflammation more precisely than a standard CRP test.",
  ["A recent infection or injury","Being overweight or smoking","Long-term inflammation"],["Usually not a concern"],
  ["How do you use hs-CRP in my case?"], decimals=2)

# ---------------- Urine ----------------
m("urine_ph","Urine pH","urine","pH","pH",[U("pH",["ph",""])],["urine ph","ph","reaction (ph)","ph (urine)"],
  "Urine pH shows how acidic or alkaline your urine is. It changes with what you eat and drink.",
  ["A diet rich in vegetables","Some urine infections"],["A diet rich in meat","Not drinking enough fluids"],
  ["Is my urine pH anything to think about?"], decimals=1)
m("urine_sg","Urine specific gravity","urine","","",[U("",["sg"])],["specific gravity","urine specific gravity","sp. gravity","sp gravity"],
  "Specific gravity shows how concentrated your urine is.",
  ["Not drinking enough fluids"],["Drinking a lot of fluids"],["Should I be drinking more water?"], decimals=3)
m("urine_pus_cells","Pus cells (urine)","urine","/hpf","/hpf",[U("/hpf",["/hpf","cells/hpf","per hpf","/h.p.f"])],
  ["pus cells","urine pus cells","wbc (urine)","leucocytes (urine)","urine wbc"],
  "Pus cells are white blood cells in urine. A few are normal; more can be a sign of irritation or infection.",
  ["A urine infection","Contamination of the sample"],["Usually not a concern"],
  ["Should I have a repeat urine test or a urine culture?"], decimals=0)

for e in M:
    with open(os.path.join(OUT, f"{e['id']}.json"), "w") as f:
        json.dump(e, f, ensure_ascii=False, indent=2); f.write("\n")
ids = sorted(e["id"] for e in M)
with open(os.path.join(OUT, "index.ts"), "w") as f:
    f.write("// GENERATED by scripts/content/markers.py — do not edit by hand.\nimport type { MarkerDef } from \"@/lib/markers/types\";\n")
    for i in ids: f.write(f"import m_{i} from \"./{i}.json\";\n")
    f.write("export const MARKER_DEFS = [" + ", ".join(f"m_{i}" for i in ids) + "] as unknown as MarkerDef[];\n")
print(len(M), "markers")
