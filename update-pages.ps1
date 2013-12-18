git checkout gh-pages
git checkout master -- sample
Copy-Item "sample\*" ".\" -recurse - force
Remove-Item "sample" -recurse
git add .
git commit -sm "[Automated] gh-pages updated to latest sample from master branch"
git remote set-url origin git@github.com:feafarot/NavRouter.git
git push origin gh-pages:gh-pages
git remote set-url origin https://github.com/feafarot/NavRouter.git
git checkout master