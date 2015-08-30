
require("shelljs/global");
var cleaner = require("./clean_repo.js");

pushd(__dirname);

if (ls("output/source_repo").length < 1) {
	cleaner();
}
rm("-rf","output/simple")
mkdir("-p","output/simple");
cd("output/simple");

popd()