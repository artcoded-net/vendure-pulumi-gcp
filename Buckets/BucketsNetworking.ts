import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { Input } from "@pulumi/pulumi";

const config = new pulumi.Config();
const env = pulumi.getStack();
const envSuffix = env !== "prod" ? `-${env}` : "";
const siteDomain = config.require<string>("siteDomain");
const projectName = gcp.config.project;

interface BucketsNetworkingInputs {
  assetsBackendId: Input<string>;
  adminBackendId: Input<string>;
}

export class BucketsNetworking {
  ipAddress: gcp.compute.GlobalAddress;
  adminHostName: string;
  assetsHostName: string;

  constructor({ adminBackendId, assetsBackendId }: BucketsNetworkingInputs) {
    this.adminHostName = `admin${envSuffix}.${siteDomain}`;
    // const serverHostName = `server.${siteDomain}`;
    this.assetsHostName = `assets${envSuffix}.${siteDomain}`;
    // Create managed SSL certificate
    const sslCertificate = new gcp.compute.ManagedSslCertificate(
      `${projectName}${envSuffix}-ssl-certificate`,
      {
        name: `${projectName}${envSuffix}-ssl-certificate`,
        description: "Vendure SSL certificate",
        managed: {
          domains: [this.adminHostName, this.assetsHostName],
        },
      }
    );
    // Reserve a static IP
    this.ipAddress = new gcp.compute.GlobalAddress(
      `${projectName}${envSuffix}-ip`,
      {
        description: "Backend ip address",
      }
    );

    const adminPathMatcherName = "admin";
    const assetsPathMatcherName = "assets";
    // The URL map
    const urlMap = new gcp.compute.URLMap(
      `${projectName}${envSuffix}-url-map`,
      {
        defaultService: adminBackendId,
        hostRules: [
          {
            hosts: [this.adminHostName],
            pathMatcher: adminPathMatcherName,
          },
          {
            hosts: [this.assetsHostName],
            pathMatcher: assetsPathMatcherName,
          },
        ],
        pathMatchers: [
          {
            name: adminPathMatcherName,
            defaultService: adminBackendId,
            pathRules: [
              {
                paths: ["/*"],
                service: adminBackendId,
              },
            ],
          },
          {
            name: assetsPathMatcherName,
            defaultService: assetsBackendId,
            pathRules: [
              {
                paths: ["/*"],
                service: assetsBackendId,
              },
            ],
          },
        ],
      }
    );

    // An https proxy
    const httpsProxy = new gcp.compute.TargetHttpsProxy(
      `${projectName}${envSuffix}-https-proxy`,
      {
        urlMap: urlMap.id,
        sslCertificates: [sslCertificate.id],
      }
    );

    // Associate IP with the forwarding rule
    const forwardingRule = new gcp.compute.GlobalForwardingRule(
      `${projectName}${envSuffix}-forwarding`,
      {
        ipProtocol: "TCP",
        portRange: "443",
        ipAddress: this.ipAddress.address,
        // networkTier: "PREMIUM",
        target: httpsProxy.id,
      }
    );

    // HTTP listening and redirect to HTTPS

    const httpPathMatcherName = "http2https";
    const httpRedirectUrlMap = new gcp.compute.URLMap(
      `${projectName}${envSuffix}-http-url-map`,
      {
        defaultUrlRedirect: {
          httpsRedirect: true,
          stripQuery: false,
        },
        hostRules: [
          {
            hosts: [this.adminHostName, this.assetsHostName],
            pathMatcher: httpPathMatcherName,
          },
          // {
          //   hosts: [serverHostName],
          //   pathMatcher: "server",
          // },
        ],
        pathMatchers: [
          {
            name: httpPathMatcherName,
            pathRules: [
              {
                paths: ["/*"],
                urlRedirect: {
                  httpsRedirect: true,
                  stripQuery: false,
                },
              },
            ],
            defaultUrlRedirect: {
              httpsRedirect: true,
              stripQuery: false,
            },
          },
        ],
      }
    );

    // An https proxy
    const httpProxy = new gcp.compute.TargetHttpProxy(
      `${projectName}${envSuffix}-http-proxy`,
      {
        urlMap: httpRedirectUrlMap.id,
      }
    );

    // Associate IP with the forwarding rule
    const httpRedirectForwardingRule = new gcp.compute.GlobalForwardingRule(
      `${projectName}${envSuffix}-forwarding-http-redir`,
      {
        ipProtocol: "TCP",
        portRange: "80",
        ipAddress: this.ipAddress.address,
        target: httpProxy.id,
      }
    );
  }
}
