function FindProxyForURL(url, host) {
  
    // Japan
	
    if (shExpMatch(url, "*.mgstage.*/*")) { 
        return 'SOCKS 198.50.214.17:6874; SOCKS 198.50.177.44:44699; SOCKS 144.217.163.138:1080; SOCKS 207.164.119.31:4145; SOCKS 173.231.114.118:4145; DIRECT';
    } 
		
	if (shExpMatch(url, "https://abema.tv/")) { 
        return 'DIRECT'; 
    } 
	
	if (shExpMatch(url, "*.akamaized.net/*")) { 
        return 'DIRECT';  
    } 
	
    // China
	
	if (dnsDomainIs(host, "pan.baidu.com")) { 
        return 'DIRECT';  
    }

	if (shExpMatch(url, "*.163.com/*")) { 
        return 'SOCKS 39.108.87.11:21071; DIRECT'; 
    }
	
	else return 'DIRECT';

}
