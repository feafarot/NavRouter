cd ..

Write-Host "Swithcing to 'gh-pages' branch..."
git checkout gh-pages

Write-Host 'Obtaining sample from master branch...'
git checkout master Compiled
git checkout master Scripts
git checkout master Sample

Write-Host "Copying files from 'Sample' and 'Compiled' to root folder..."
Copy-Item "Sample\*" ".\" -recurse -force

Write-Host "Removing 'Sample' folder..."
Remove-Item "Sample" -recurse

Write-Host "Indexing of changes in git..."
git add . -u

Write-Host "Commiting changes..."
git commit -sm "[Automated] gh-pages updated to latest sample from master branch"

#Write-Host "Pushing commit using SSH..."
#git remote set-url origin git@github.com:feafarot/NavRouter.git
#git push origin gh-pages:gh-pages
#git remote set-url origin https://github.com/feafarot/NavRouter.git

Write-Host "Pushing 'gh-pages' into origin"
git push origin gh-pages:gh-pages

Write-Host "Returning to 'master' branch..."
git checkout master

Write-Host "Restorin removed files..."
git reset --hard

Write-Host "Updating 'gh-pages' ended."