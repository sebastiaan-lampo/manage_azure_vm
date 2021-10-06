param
(
    [Parameter (Mandatory = $false)]
    [object] $WebhookData
)
$SCHEMA = "AzureVmManagerPlugin"

# If runbook was called from Webhook, WebhookData will not be null.
if ($WebhookData) {
    $WebhookBody = (ConvertFrom-Json -InputObject $WebhookData.RequestBody)
    $schemaId = $WebhookBody.schemaId

    if ($schemaId -eq $SCHEMA) {
        # Using our own custom schema reduces chances of accidental use by others.
        $RequestContext = [object] ($WebhookBody.data).context
        Write-Output $RequestContext
        $SubId = $RequestContext.subscriptionId
        $ResourceGroupName = $RequestContext.resourceGroupName
        $ResourceType = $RequestContext.resourceType
        $ResourceName = $RequestContext.resourceName
        $target_state = ($WebhookBody.data).target_state
    } else {
        # Schema not supported
        Write-Error "The alert data schema - $schemaId - is not supported."
        throw "Not coming from correct schema"
    }
    # Stop for VMs only
    if ($ResourceType -eq "Microsoft.Compute/virtualMachines")
    {
        # Authenticate to Azure by using the service principal and certificate.
        # Write-Output "Authenticating to Azure with service principal and certificate"
        $Conn = Get-AutomationConnection -Name "AzureRunAsConnection"
        if ($Conn -eq $null) {
            throw "Check if AzureRunAsConnection exists in the Automation account."
        }
        $auth = Connect-AzAccount -ServicePrincipal `
            -Tenant $Conn.TenantID `
            -ApplicationId $Conn.ApplicationID `
            -CertificateThumbprint $Conn.CertificateThumbprint
        if ($auth -ne $null) {
            Write-Debug "Authenticated to Azure with service principal."
        }
        else {
            Write-Error "Could not authenticate with service principal."
            throw "Authentication Error"
        }

        Write-Output "Getting VM data by ResourceGroupName and Name."
        $vm = Get-AzVm -Status -ResourceGroupName $ResourceGroupName -Name $ResourceName
        # Watch out. Output different if RGN not provided. In that case status is $vm.PowerState
        $curr_state = $vm.Statuses[1].DisplayStatus
        Write-Debug "Current status: $curr_state"

        if ($target_state -eq $curr_state) {
            Write-Output "VM is already in target state: $target_state"
            Return
        }

        Write-Output "Changing VM status to $target_state from $curr_state"
        if ($target_state -eq "VM running") {
            Write-Output "Starting $ResourceName"
            $out = Start-AzVm -ResourceGroupName $ResourceGroupName -Name $ResourceName
            Write-Output $out
        }
        elseif ($target_state -eq "VM deallocated") {
            Write-Output "Stopping $ResourceName"
            $out = Stop-AzVm -Force -ResourceGroupName $ResourceGroupName -Name $ResourceName

        }
        else {
            Write-Error "Changing to state $target_state is not supported at this time."
            Write-Output "System in state: ", $curr_state
        }
    }
} else {
    # Error
    write-Error "This runbook is meant to be started from the Firefox Azure VM Manager plugin only."
}