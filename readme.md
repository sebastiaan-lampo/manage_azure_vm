# Azure VM Manager

## Intro

This plugin combines with an Azure automation runbook to enable users to start and stop (deallocate) a VM without needing any azure credentials. The runbook has to be linked to a subscription (or IAM) for permissions. It takes in a ResourceGroupName and ResourceName as well as a target state. It authenticates using a service principal (Run-As-Connection required) and requests a state of the VM using the normal Start-AzVm and Stop-AzVm cmd-lets included in Az.Compute.

## Installation

1. Create an Azure Automation Account with "Run As" enabled. [https://docs.microsoft.com/en-us/azure/automation/create-run-as-account](Azure Docs)
2. Create a new runbook in the automation account and copy the `runbook.ps1` code into it.
3. Create a webhook for the runbook. Carefully note the URL as it will not be accessible later and is required for the plugin.
4. Install the firefox plugin
5. Enter the url, resource group and VM name in the configuration fields

## Use

Change the state of the VM using the "start" and "stop" buttons. Note that it is not possible to poll the VM for its current state. For additional certainty, an authenticated Azure user should validate the correct state change of the VM.