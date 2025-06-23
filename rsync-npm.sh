#!/usr/bin/env bash

syncFiles() {
    appPath=$APP_MONOREPO_LOCAL_PATH
    workingPath=$CURRENT_WORKING_PATH

    echo "**********************" $workingPath
    echo "**********************" $appPath

    # Arrays to store package information
    declare -a package_dirs=()
    declare -a package_names=()
    declare -a relative_paths=()

    echo "Discovering packages..."
    echo "======================="

    # Find all package.json files, excluding node_modules and .next directories
    for package_json in $(find $workingPath/packages -name "package.json" | grep -v node_modules | grep -v "\.next"); do
        # Get the directory containing the package.json
        package_dir=$(dirname "$package_json")
        
        # Extract package name and private status from package.json
        package_name=$(node -p "try { JSON.parse(require('fs').readFileSync('$package_json', 'utf8')).name || '' } catch(e) { '' }")
        is_private=$(node -p "try { JSON.parse(require('fs').readFileSync('$package_json', 'utf8')).private || false } catch(e) { false }")
        
        # Skip if package name is empty or if it's a private package
        if [ -z "$package_name" ] || [ "$is_private" = "true" ]; then
            echo "Skipping: ${package_dir#$workingPath/packages/} (private or no name)"
            continue
        fi
        
        # Get relative path from packages directory
        relative_path=${package_dir#$workingPath/packages/}
        
        # Store package information
        package_dirs+=("$package_dir")
        package_names+=("$package_name")
        relative_paths+=("$relative_path")
        
    done

    echo ""
    echo "Packages to sync (${#package_names[@]} total):"
    echo "=============================================="
    
    # Print all packages that will be synced
    for i in "${!package_names[@]}"; do
        echo "[$((i+1))] ${relative_paths[i]} -> ${package_names[i]}"
    done

    echo ""
    echo "Starting rsync operations..."
    echo "============================"
    
    # Perform rsync for all collected packages
    for i in "${!package_dirs[@]}"; do
        echo "Syncing [$((i+1))/${#package_dirs[@]}]: ${relative_paths[i]} -> ${package_names[i]}"
        
        rsync -avz --exclude node_modules \
              "${package_dirs[i]}/" \
              "$appPath/node_modules/${package_names[i]}/"
        
        if [ $? -eq 0 ]; then
            echo "✓ Successfully synced ${package_names[i]}"
        else
            echo "✗ Failed to sync ${package_names[i]}"
        fi
        echo ""
    done
    
    echo "Rsync operations completed!"
}

syncFiles
