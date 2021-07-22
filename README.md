# Atlas custom scaling Realm function
Demo of how to customize cluster scalability via a realm function that evaluates the CPU of the primary node.

I reckon you could use the realm-cli to import the code into your realm cloud as I have exported it using the Realm cli, but havent tried on a clean Realm enviroment.

If you want to directly check out the code there are two main functions: scaleUp and you will also need modifyCluster (both under the functions folder). ScaleUp evaluates if scaling is needed and proceeds to call modifyCluster to send the change.

The code won't work out of the box, you'll need to create a few secrets and values (check the values folder), they are self-explanatory.
Also you'll need to create a trigger that fires every few minutes the scaleUp function on your target cluster.


# Potential Improvements

## Enhance the policies and add more options
Now we just monitor the last X minutes of a single metric, we could evaluate more metrics.

Also control if the cluster is scaling up already and track when it was last 
