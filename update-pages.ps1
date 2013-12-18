Write-Host '~- Running: git checkout gh-pages'
git checkout gh-pages
Write-Host '~- Running: git checkout master -- sample'
git checkout master -- sample
Write-Host '~- Running: Copy-Item "sample\*" ".\" -recurse - force'
Copy-Item "sample\*" ".\" -recurse - force
Write-Host '~- Running: Remove-Item "sample" -recurse'
Remove-Item "sample" -recurse
Write-Host '~- Running: git add .'
git add .
Write-Host '~- Running: git commit -sm "..."'
git commit -sm "[Automated] gh-pages updated to latest sample from master branch"
#git remote set-url origin git@github.com:feafarot/NavRouter.git
#git push origin gh-pages:gh-pages
#git remote set-url origin https://github.com/feafarot/NavRouter.git
#git checkout master
