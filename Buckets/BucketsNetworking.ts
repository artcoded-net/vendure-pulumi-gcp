import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import { Input } from "@pulumi/pulumi";

const config = new pulumi.Config();
const projectName = gcp.config.project;
const stack = pulumi.getStack();
const namingPrefix = `${projectName}-${stack}`;
const siteDomain = config.require<string>("siteDomain");

interface BucketsNetworkingInputs {
  assetsBackendId: Input<string>;
  adminBackendId: Input<string>;
  domainSuffix?: string;
}

export class BucketsNetworking {
  ipAddress: gcp.compute.GlobalAddress;
  adminHostName: string;
  assetsHostName: string;

  constructor({
    adminBackendId,
    assetsBackendId,
    domainSuffix,
  }: BucketsNetworkingInputs) {
    this.adminHostName = domainSuffix
      ? `admin-${domainSuffix}.${siteDomain}`
      : `admin.${siteDomain}`;
    this.assetsHostName = domainSuffix
      ? `assets-${domainSuffix}.${siteDomain}`
      : `assets.${siteDomain}`;
    // Create managed SSL certificate
    const certificateName = `${namingPrefix}-ssl-certificate`;
    const sslCertificate = new gcp.compute.ManagedSslCertificate(
      certificateName,
      {
        name: certificateName,
        description: "Vendure SSL certificate",
        managed: {
          domains: [this.adminHostName, this.assetsHostName],
        },
      }
    );
    // Reserve a static IP
    this.ipAddress = new gcp.compute.GlobalAddress(`${namingPrefix}-ip`, {
      description: "Backend ip address",
    });

    const adminPathMatcherName = "admin";
    const assetsPathMatcherName = "assets";
    // The URL map
    const urlMap = new gcp.compute.URLMap(`${namingPrefix}-url-map`, {
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
    });

    // An https proxy
    const httpsProxy = new gcp.compute.TargetHttpsProxy(
      `${namingPrefix}-https-proxy`,
      {
        urlMap: urlMap.id,
        sslCertificates: [sslCertificate.id],
      }
    );

    // Associate IP with the forwarding rule
    const forwardingRule = new gcp.compute.GlobalForwardingRule(
      `${namingPrefix}-forwarding`,
      {
        ipProtocol: "TCP",
        portRange: "443",
        ipAddress: this.ipAddress.address,
        target: httpsProxy.id,
      }
    );

    // HTTP listening and redirect to HTTPS

    const httpPathMatcherName = "http2https";
    const httpRedirectUrlMap = new gcp.compute.URLMap(
      `${namingPrefix}-http-url-map`,
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
      `${namingPrefix}-http-proxy`,
      {
        urlMap: httpRedirectUrlMap.id,
      }
    );

    // Associate IP with the forwarding rule
    const httpRedirectForwardingRule = new gcp.compute.GlobalForwardingRule(
      `${namingPrefix}-forwarding-http-redir`,
      {
        ipProtocol: "TCP",
        portRange: "80",
        ipAddress: this.ipAddress.address,
        target: httpProxy.id,
      }
    );
  }
}
