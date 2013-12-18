Write-Host "Swithcing to 'gh-pages' branch..."
git checkout gh-pages

Write-Host 'Obtaining sample from master branch...'
git checkout master sample

Write-Host "Copying files from 'sample' to root folder..."
Copy-Item "sample\*" ".\" -recurse -force

Write-Host "Removing 'sample' folder..."
Remove-Item "sample" -recurse

Write-Host "Indexing of changes in git..."
git add .

Write-Host "Commiting changes..."
git commit -sm "[Automated] gh-pages updated to latest sample from master branch"

#Write-Host "Pushing commit using SSH..."
#git remote set-url origin git@github.com:feafarot/NavRouter.git
#git push origin gh-pages:gh-pages
#git remote set-url origin https://github.com/feafarot/NavRouter.git

Write-Host "Returning to 'master' branch..."
git checkout master

Write-Host "Updating 'gh-pages' ended."