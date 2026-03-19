#!/bin/bash

# Script to create and maintain test branch

echo "Setting up test branch for deployment..."

# Create test branch if it doesn't exist
if ! git show-ref --verify --quiet refs/heads/test; then
    echo "Creating test branch from main..."
    git checkout main
    git pull origin main
    git checkout -b test
    git push -u origin test
    echo "Test branch created and pushed!"
else
    echo "Test branch already exists. Switching to test branch..."
    git checkout test
    git pull origin test
fi

echo "Current branch: $(git branch --show-current)"
echo ""
echo "To keep test branch in sync with main:"
echo "1. Make changes to main branch"
echo "2. Switch to test branch: git checkout test"
echo "3. Merge main into test: git merge main"
echo "4. Push test branch: git push origin test"
echo ""
echo "Deployments:"
echo "- Main branch → Live mode: eastapp.booking.dynevents.com"
echo "- Test branch → Test mode: eastapp-test.booking.dynevents.com"
