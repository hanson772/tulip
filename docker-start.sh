#VERSION=$(node -p "require('./backend/package.json').version")

# 方法2：使用 node --eval
VERSION=$(node --eval "console.log(require('./backend/package.json').version)")

echo  "构建版本： $(VERSION)"
# 然后构建
docker build -t tulip:$VERSION .