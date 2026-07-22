// 驗證 data/*.json 與 data/demo/*.json 是否符合 data/schemas/*.schema.json(PRD.md M1 驗收標準)
const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");
const addFormats = require("ajv-formats");

const root = path.join(__dirname, "..");
const schemaDir = path.join(root, "data", "schemas");
const dataDir = path.join(root, "data");
const demoDir = path.join(root, "data", "demo");

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const schemaFiles = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".schema.json"));

let failures = 0;
let checked = 0;

for (const schemaFile of schemaFiles) {
  const baseName = schemaFile.replace(".schema.json", "");
  const schema = JSON.parse(fs.readFileSync(path.join(schemaDir, schemaFile), "utf8"));
  const validate = ajv.compile(schema);

  for (const dir of [dataDir, demoDir]) {
    const dataFile = path.join(dir, `${baseName}.json`);
    if (!fs.existsSync(dataFile)) {
      console.error(`✗ MISSING  ${path.relative(root, dataFile)} (required by ${schemaFile})`);
      failures++;
      continue;
    }
    const data = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    const valid = validate(data);
    checked++;
    if (valid) {
      console.log(`✓ OK       ${path.relative(root, dataFile)}`);
    } else {
      failures++;
      console.error(`✗ INVALID  ${path.relative(root, dataFile)}`);
      for (const err of validate.errors) {
        console.error(`    ${err.instancePath || "/"} ${err.message}`);
      }
    }
  }
}

console.log(`\n${checked - failures}/${checked} 檔案通過驗證`);
if (failures > 0) {
  console.error(`${failures} 項驗證失敗`);
  process.exit(1);
}
