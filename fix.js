
const fs = require('fs');
let code = fs.readFileSync('app/src/components/common/ProductsTableSection.tsx', 'utf8');

code = code.replace(/<Button variant="default"/g, '<Button variant="solid"');
code = code.replace(/<Button variant="link"/g, '<Button className="text-primary hover:underline"');
code = code.replace(/<Badge variant="outline"/g, '<Badge variant="default"');
code = code.replace(/<IconButton variant="ghost"/g, '<IconButton variant="view"');

fs.writeFileSync('app/src/components/common/ProductsTableSection.tsx', code);

