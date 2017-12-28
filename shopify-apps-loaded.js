/*
  Onload for Shopify Apps
  Author: Henry Barnathan
  When an app uses ScriptTags to load resources onto the frontend of a Shopify store, Shopify loads those resources, after the other hard-coded resources, once page has loaded. This page may have resources less critical than apps. In my use-case, secondary product images were less important than product ratings. Live chat widgets as well. This bit of code waits for the apps to load, then sends an Event to the window object that the apps have loaded. You can then use that globally to load the less important resources with:
  window.addEventListener('appsLoaded', function(){
    ...
  });
  
  You can add a failsafe in case the apps' hosts are too slow or down. Simply send the Event after a fixed period of time: (be sure that calling the event twice doesn't do harm - otherwise you can use a clear timeout and an EventListener to cancel either-or)
    var failsafe = setTimeout(function(){
      window.dispatchEvent(new Event('appsLoaded'));
      headObserver.disconnect();
    }, 3000);
  */



window.addEventListener('load', function(){ // Starts after page load, like the Shopify ScriptTag loader

  var mutationNodes = []; // Empty array to hold external resources
  
  var loadElement = function(mutationList) { // Resources get passed here as they are populated into the head by Shopify's app loader
    mutationList.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node){
        if (
          (node.tagName === 'LINK' && node.hasAttribute('HREF')) || 
          (node.tagName === 'SCRIPT' && node.hasAttribute('SRC')) // Looking for external scripts and stylesheets
        ) {
          mutationNodes.push(node); // Pushes the resource tag to the array
          node.addEventListener('load',function(){ // Waits for the resource to load
            setTimeout(function(){unloadElement(node)},100); // Calls a function when the resource is loaded. Added some time padding here in the unlikely event the resource is loading faster than the app loader, need it in my specific use case
          });
        }
      });
    });
  }
  
  var unloadElement = function(addedNode) { // Handles loaded resources
    mutationNodes.splice(mutationNodes.indexOf(addedNode),1); // Deletes the loaded resource from the array
    if (mutationNodes.length === 0) { // When array is emptied, ie all resources have loaded
      window.dispatchEvent(new Event('appsLoaded'));  // Sends an Event 'appsLoaded' to the window
      headObserver.disconnect(); // Disconnects the MutationObserver
    }
  }
  
  var head = document.getElementsByTagName('HEAD')[0];
  
  var headObserver = new MutationObserver(loadElement);
  
  headObserver.observe(head, {childList: true}); // Watches document head for changes in the child list
  
});