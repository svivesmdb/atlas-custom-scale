exports = async function(username, password, projectID, clusterName, metric, last_x_minutes) {
  
  var processes_and_ports = [];

   const get_all_clusters = {
    "scheme":"https",
    "host":"cloud.mongodb.com",
    "path":"api/atlas/v1.0/groups/" + projectID + "/clusters/",
    "query": {},
    "username":username,
    "password":password,
    "digestAuth": true
  };
  
  const procs_response = await context.http.get(get_all_clusters);
  cluster_list = EJSON.parse(procs_response.body.text());
  var clusters = cluster_list.results;
  
  for (var j=0; j < clusters.length; ++j) {
    if (clusters[j].name.toLowerCase() === clusterName.toLowerCase()) {
      // It's the cluster we are looking for
      // now retrieve the cluster's processes.
      var uri = clusters[j].mongoURI;
      uri = uri.replace('mongodb://', '');
      var hosts = uri.split(',');
      
      for (var k=0; k < hosts.length; k++) {
        processes_and_ports.push( {
          host: hosts[k].split(':')[0],
          port: hosts[k].split(':')[1]
        })
        
      }  
    }
  }

  
  var per_process_metrics = {};


  for (var p = 0; p < processes_and_ports.length; p++) {

    // Get the latest metrics for the process within 
    // the cluster and port
    var host = processes_and_ports[p].host;
    var port = processes_and_ports[p].port;
    
    
    const params = {granularity:["PT1M"], period:["P0DT" + last_x_minutes + "M"], pretty:["true"]};
    
    const monitor_url = {
      "scheme":"https",
      "host":"cloud.mongodb.com",
      "path":"api/atlas/v1.0/groups/" + projectID + "/processes/" + host + ":" + port + "/measurements",
      "query": params,
      "username":username,
      "password":password,
      "digestAuth": true
    };
    
    // Parse the metrics
    const monitor_response = await context.http.get(monitor_url);
    status = EJSON.parse(monitor_response.body.text());
    var measures = status['measurements'];
    
    var datapoint = null;
  
    // Gather the metrics (CPU for example)
    for (var i=0; i < measures.length; ++i) {
      k = measures[i]
      //console.log(k['name'])
      if (k['name'] == metric) {
          datapoint = k
      }
    }
    
    per_process_metrics[host+":"+port] = datapoint
  }
  
  return {metrics: per_process_metrics}
  
};