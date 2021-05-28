# Atlas custom scaling Realm function
Demo of how to customize cluster scalability via a realm function that evaluates the CPU of the primary node.

I reckon you could use the realm-cli to import the code into your realm cloud as I have exported it using the Realm cli, but havent tried on a clean Realm enviroment.

If you want to directly check out the code there are two main functions: scaleUp and you will also need modifyCluster (both under the functions folder). ScaleUp evaluates if scaling is needed and proceeds to call modifyCluster to send the change.

The code won't work out of the box, you'll need to create a few secrets and values (check the values folder), they are self-explanatory.
Also you'll need to create a trigger that fires every few minutes the scaleUp function on your target cluster.


# Improvements

## Evaluate not only the primary
Now we are just monitoring one node of the replicaset, the primary that you need to feed in on the scaleUp function. It's for the sake of simplicity. 
The idea would be to monitor the whole set of nodes of the cluster and decide on what to do i.e. apply some kind of policy (if primaries are really busy as well as secondaries then scale up for example).
We could list the mongod instances in the cluster via API and then evaluate the state to decide what to do.

## Enhance the policies and add more options
Now we just monitor the last X minutes of the Process kernel CPU. It's a basic metric, should be enhanced to monitor more metrics.
