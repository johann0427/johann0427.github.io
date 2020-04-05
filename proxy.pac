function FindProxyForURL(url, host) {
  
    // Japan
	
    if (shExpMatch(url, "*.mgstage.*/*")) { 
        return 'SOCKS 198.50.214.17:6874';
    } 
		
	if (shExpMatch(url, "https://abema.tv/")) { 
        return 'DIRECT'; 
    } 
	
	if (shExpMatch(url, "*.akamaized.net/*")) { 
        return 'DIRECT';  
    } 
	
	
	// Russia SOCKS 83.219.139.93:4145
	
	if (shExpMatch(url, "*.fanatical.com/*")) { 
        return 'DIRECT';
    } 
	
	if (shExpMatch(url, "*.steampowered.com/*")) { 
        return 'DIRECT';
    }
	

    // China
	
	if (dnsDomainIs(host, "pan.baidu.com")) { 
        return 'DIRECT';  
    }

	if (shExpMatch(url, "*.163.com/*")) { 
        return 'SOCKS 39.108.87.11:21071'; 
    }
	
	else return 'DIRECT';

}
