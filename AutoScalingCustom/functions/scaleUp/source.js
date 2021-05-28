exports = async function() {

  // What node of the cluster are we monitoring
  const host = "<YOUR_PRIMARY_HERE>"
  const port = "27017"

  // The CPU threshold we want to monitor against
  const THRESHOLD_CPU_SCALE = 0.85; // 85%
  // For how many minutes the average should be higher than the value above
  const CONSIDER_LAST_X_MIN = 15; // minutes
  
  // Supply projectID and clusterNames...
  const projectID = context.values.get("MonitoringProjectId");
  const clusterName = 'MyAtlasCluster';
  // Get stored credentials...
  const username = context.values.get("AtlasPublicKey");
  const password = context.values.get("AtlasPrivateKey");


  // Get the latest metrics
  const params = {granularity:["PT1M"], period:["P0DT"+CONSIDER_LAST_X_MIN+"M"], pretty:["true"]}
  const monitor_url = {
    "scheme":"https",
    "host":"cloud.mongodb.com",
    "path":"api/atlas/v1.0/groups/"+ projectID + "/processes/" + host + ":" + port + "/measurements",
    "query": params,
    "username":username,
    "password":password,
    "digestAuth": true
  };

  // Parse the metrics
  const monitor_response = await context.http.get(monitor_url)
  status = EJSON.parse(monitor_response.body.text());
  var measures = status['measurements']
  var datapoint = null;
  var k = null
  
  // Gather the metrics (CPU for example)
  for (var i=0; i < measures.length; ++i) {
    k = measures[i]
    //console.log(k['name'])
    if (k['name'] == 'PROCESS_CPU_KERNEL') {
        datapoint = k
    }
  }
  
  // Average them
  var sum = 0,count = 0;
  datapoint['dataPoints'].forEach(state => { 
    console.log(state['timestamp'], state['value']);
    if (! isNaN(state['value'])) {
      sum += state['value']
      count++;
    }
  });
  var avg_cpu = sum / count;
  console.log("Average CPU of the last " +  CONSIDER_LAST_X_MIN + " minutes:" + Math.ceil(avg_cpu*1000)/10 + "%" )
  
  
  // Check if we need to scale (you can scale down depending on the 
  // comparison below )
  if (avg_cpu < THRESHOLD_CPU_SCALE) {
    
    console.log("OK - CPU is below average, no need to scale")
    
  } else {
    // Set the desired instance size...
    // You could scale up or down here 
    const body =    {
        "providerSettings" : {
          "providerName" : "GCP",
          "instanceSizeName" : "M20"
        }
      };
    
    result = await context.functions.execute('modifyCluster', username, password, projectID, clusterName, body);
    console.log(EJSON.stringify(result));
    
    if (result.error) {
      return result;
    }
  
    return clusterName + " scaled up"; 
  }

  return null;
};